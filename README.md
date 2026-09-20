# RIM-EX

Peer-to-peer exchange of Mauritanian ouguiya (MRU) and Russian rubles (₽) for Mauritanian students in
Russia. RIM-EX only connects the two sides: it never holds or moves money (see
`currency-exchange-app-spec.md`). Next.js 16 · Tailwind v4 · Supabase.

```bash
npm install
npm run dev        # http://localhost:3000
```

Backend setup (Supabase project, migrations): **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)**.

The admin dashboard is a separate app in its own repo, **[admin-rim-ex](https://github.com/maurialpha2024-collab/admin-rim-ex)**,
deployed on its own domain. The two are connected through the same Supabase project (same users, same data).

## Design system

- **Tokens** live in [src/app/globals.css](src/app/globals.css): light and dark palettes as CSS variables,
  mapped to Tailwind utilities (`bg-surface`, `text-muted`, `border-line`, `bg-primary`, `text-positive-ink`, …).
  No component hardcodes a colour. Every text/background pair was checked for WCAG AA (≥ 4.5:1).
  The dark theme applies from the OS setting, or from the theme toggle (a `theme` cookie).
- **Fonts**: IBM Plex Sans Arabic (Arabic + Latin) and JetBrains Mono for every amount, rate and timestamp
  (`.money` / `.mono` utilities, always left-to-right).
- **Primitives** in `src/components/ui/` (button, badge, card, input, dialog, dropdown, tabs, skeleton,
  avatar). Shared pieces: `MoneyAmount`, `StatusPill` (icon + label, never colour alone), `TrustBadge`,
  `CountdownTimer`, `AdCard`, `TradePanel`, `ChatThread`, `RatingCard`, admin `PhotoViewer`.
- **Money formatting** is centralised in [src/lib/money.ts](src/lib/money.ts): MRU as whole numbers with a
  "MRU" suffix, ₽ with two decimals and a "₽" suffix, separators from the UI locale (Intl/CLDR).
  Rates are stored and shown as **MRU per 1 ₽**, as in the spec.

## Languages (French default, English, Arabic with full RTL)

The language is a `lang` cookie (no URL change), read on the server in
[src/lib/i18n/server.ts](src/lib/i18n/server.ts); `<html lang dir>` follows it, so layouts mirror through
CSS logical properties (`ms-*`, `pe-*`, `text-start`, `rtl:` variants). Translations are typed modules in
`src/lib/i18n/messages/{fr,en,ar}/`; the English and Arabic packs are `Record<keyof French, string>`, so a
missing translation is a compile error. To add a language: add it to `LOCALES` in `config.ts`, create its pack, register it in `messages/index.ts`. Use `getI18n()` in server components and `useI18n()` in client ones.
Photos, logos and passport images are never mirrored.

## Trades

An accepted ad locks for 30 minutes. Both sides pay each other directly and each presses **Confirm payment**;
the trade completes when both have. Until you have confirmed, either side can **cancel** with a reason
(`cancel_trade()`, migration 0008): if the person who posted the ad cancels, the ad is closed; if the other
side cancels, it goes back on the market. After 30 minutes without both confirmations it is released
automatically. Amounts are shown in **MRU** (Mauritanian ouguiya) and **₽** (Russian ruble).

## Roles

Users trade after admin verification + an active subscription; admins work in the separate
[admin-rim-ex](https://github.com/maurialpha2024-collab/admin-rim-ex) dashboard (verification queue, users, orders &
trades, audit log, admin management). Only the owner can add or disable admins.

## Deploying (Netlify)

This repo is one Netlify site; the admin dashboard ([admin-rim-ex](https://github.com/maurialpha2024-collab/admin-rim-ex))
is a second site on its own domain. Both point at the same Supabase project.

1. Run every file in `supabase/migrations/` once, in order (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md) §3).
2. Netlify → *Add new site → Import an existing project* → this repo. Netlify detects Next.js;
   [netlify.toml](netlify.toml) pins Node 22.
3. Set three environment variables (Site configuration → Environment variables), values from `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the secret `SUPABASE_SERVICE_ROLE_KEY`
   (the public order book and the trader stats read with it, server-side only).
4. After the first deploy, in Supabase → Authentication → URL Configuration set **Site URL** to this site's
   address (`https://<web-domain>`) and add `https://<web-domain>/**` to Redirect URLs, otherwise confirmation
   emails keep linking to localhost. Also add the admin site's `https://<admin-domain>/**` there.
5. Keep `src/proxy.ts` (the route guard; called `middleware.ts` before Next.js 16); test signup, login,
   verification, a trade and a cancellation. `/admin` does not exist here and answers 404.
