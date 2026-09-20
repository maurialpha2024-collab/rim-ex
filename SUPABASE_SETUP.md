# Linking the app to Supabase

This app is already wired to talk to Supabase (`src/lib/supabase/*`, `src/proxy.ts`,
`supabase/migrations/0001_init.sql`). You just need to create the project and plug in three
values.

The admin dashboard is a separate app in its own repo (`admin-rim-ex`). It uses this same Supabase
project and the same three values; the database schema and this guide live here.

## 1. Create the Supabase project

1. Go to https://supabase.com/dashboard → **New project**.
2. Pick a name (e.g. `sarafi`), a strong database password (save it), and a region close to
   your users (e.g. Frankfurt for Russia/Europe).
3. Wait ~2 minutes for provisioning.

## 2. Get your API keys

In the new project: **Project Settings → API**.

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secret — server-only, powers the admin
  dashboard, never expose to the browser or commit it)

Copy `.env.local.example` to `.env.local` and fill these three in:

```bash
cp .env.local.example .env.local
```

## 3. Run the schema migration

**Project → SQL Editor → New query**, paste the entire contents of
`supabase/migrations/0001_init.sql`, and run it. This creates:

- All 7 tables from the spec (`users`, `admins`, `orders`, `trades`, `chat_messages`,
  `ratings`, `admin_audit_log`)
- A trigger that auto-creates a `users` row whenever someone signs up via Supabase Auth
- Three RPC functions used by the app for atomic, race-safe operations:
  - `accept_order(order_id)` — locks the order and creates the trade in one transaction
  - `confirm_trade(trade_id)` — records a confirmation, auto-completes when both sides confirm
  - `release_expired_trades()` — releases trades locked >30 minutes back to `open`
- Row Level Security policies for every table (see §6 below)
- The `passport-photos` Storage bucket with write-once upload policies

**Then run the later migrations, in order** (each one in its own SQL Editor query, once; `0005`
to `0008` are also safe to re-run, `0001` and `0004` are not):

| File | Adds |
|---|---|
| `0002_submit_verification.sql` | `submit_verification()` RPC used by the verify page |
| `0003_fix_passport_upload_policy.sql` | passport upload policy (write-once by file name) |
| `0004_chat_attachments.sql` | photo / voice messages and the `trade-attachments` bucket |
| `0005_chat_open_after_completion.sql` | chat stays open after payment; Realtime for chat + trades |
| `0006_ratings_realtime.sql` | live ratings in the trade room |
| `0007_admin_management.sql` | owner / admin roles, disable flag, admin profiles auto-verified |
| `0008_cancel_trade.sql` | **trade cancellation**: `cancel_trade()` RPC, who cancelled and why |

Until `0008` is run, the "Cancel trade" button shows a message asking the owner to run it.

(Alternatively, if you use the Supabase CLI: `supabase link --project-ref <ref>` then
`supabase db push`.)

## 4. Schedule the 30-minute trade timeout

`release_expired_trades()` needs to run periodically. Easiest option — enable **pg_cron**:

1. **Database → Extensions** → enable `pg_cron`.
2. In the SQL Editor:
   ```sql
   select cron.schedule(
     'release-expired-trades',
     '*/1 * * * *',
     $$ select public.release_expired_trades(); $$
   );
   ```
   This runs the check every minute.

(Alternative: a Supabase Edge Function on a cron trigger that calls
`supabase.rpc('release_expired_trades')` — use this if you'd rather keep the scheduling logic
outside the database.)

## 5. Admin accounts (several admins, each with their own login)

The `admins` table is intentionally separate from `users` (per spec §6.6), but admins still
authenticate through the same Supabase Auth (simplest option for v1 — see §7 below for a
stricter alternative). A row in `admins` is what grants dashboard access; anyone without one
(or whose row is disabled) is bounced from every `/admin/*` route.

**First admin (the owner)** — once, by hand:

1. **Authentication → Users → Add user** with the admin's email/password (tick "Auto confirm").
2. In the SQL Editor:
   ```sql
   insert into public.admins (id, email, name)
   values ('<their auth.users id — copy from the Users list>', 'admin@example.com', 'Admin Name');
   ```
3. Run `supabase/migrations/0007_admin_management.sql`. It adds roles (the earliest admin
   becomes the **owner**), a soft-disable flag, and a trigger that keeps every admin's trader
   profile **verified + subscription-active**.

**More admins** — no SQL needed. Sign in to the admin dashboard (`/admin/login`) as the owner, open **Admins**, and
use *Add an admin* (name, email, password; *Generate* makes a strong one). The account is
created already email-confirmed, listed in the Admins list, and its profile is verified and
activated. Admins can change their own password under *My account*; the owner can reset any
admin's password, disable/enable an admin, or fix an unverified profile from the same list.
Only the owner can add or disable admins.

**Adding several at once** — `scripts/seed-admins.mjs` in the admin repo (`admin-rim-ex`; run it from that folder; list the emails in the git-ignored `scripts/admins.local.txt`, or pass
`--emails a@x.com,b@y.com`). The password comes from an environment variable so it never lands
in the repo:

```powershell
node scripts/seed-admins.mjs --dry-run                       # preview, changes nothing
$env:ADMIN_SEED_PASSWORD = "choose-a-strong-one"; node scripts/seed-admins.mjs
```

It is safe to re-run: accounts that already exist are kept (their password is only changed with
`--reset-password`).

## 6. How RLS maps to the spec's rules

- **Guests** can read the order book (`orders`) and public profile fields (`users`), but the
  `accept_order` RPC checks `verification_status = 'verified'` and
  `subscription_status = 'active'` server-side — so even a modified client can't bypass §4/§7.
- **Trades and chat** are only visible to the two participants — enforced by RLS on `trades`
  and `chat_messages`, not just hidden in the UI.
- **Passport photos**: the storage policy lets a user upload into `passport-photos/<their-uid>/`
  exactly once (write-once) and read only their own file. No delete/update policy exists for
  end users — matching the "never deletable" requirement at the database level.
- **Admin reads/writes** (verification queue, user management, full trade/chat visibility,
  audit log) go through `src/lib/supabase/admin.ts`, which uses the `service_role` key and
  bypasses RLS entirely. Every admin server action (`src/app/admin/actions.ts` in the admin repo) first checks
  the caller's session against the `admins` table before touching anything — so the
  service-role key is never reachable from the browser, only from server actions gated by that
  check.

## 7. Hardening admin auth further (optional, post-v1)

For v1, "isolated" is achieved via the separate `admins` table + a hard gate in
the dashboard layout (admin repo) and every admin server action — a compromised regular-user session
cannot reach any admin data or action. If you want harder isolation later (e.g. compliance
requirement), options in increasing order of effort:

1. Require a second factor (TOTP) for admin accounts via Supabase Auth MFA.
2. Put the admin dashboard behind a **separate Supabase project** entirely (its own Auth users,
   its own service role key) and have it read the main project's data through a small internal
   API instead of directly — full isolation, more infra to run.

## 8. Generating typed database types (optional)

`src/lib/database.types.ts` is hand-written to match the migration. Once your project is live,
you can regenerate it from the real schema:

```bash
npx supabase login
npx supabase gen types typescript --project-id <your-project-ref> > src/lib/database.types.ts
```

## 9. Local dev

```bash
npm install
cp .env.local.example .env.local   # fill in the 3 keys from step 2
npm run dev
```

- Web app (this repo): http://localhost:3000
- Admin dashboard (the `admin-rim-ex` repo, started there with `npm run dev`): http://localhost:3001/admin/login

## Open question flagged by the spec (§7)

The subscription payment method isn't decided yet. Until it is, `subscription_status` can only
be flipped manually by an admin (**Admin → Users → Activate subscription**) — there's no
payment integration wired up. When you pick a provider (Stripe, a local Russian processor,
manual bank transfer confirmation, etc.), that flow just needs to end by setting
`subscription_status = 'active'` and `subscription_expires_at` on the user's row — everything
else (RLS checks, the trading gate) already keys off those two columns.
