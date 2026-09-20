# Build Brief: P2P Currency Exchange Web App for Mauritanian Students in Russia

## 1. Overview

A web app that lets Mauritanian students in Russia exchange currency with
each other peer-to-peer, similar to Binance P2P. Users who hold a currency
can post a sell order at their own rate; users who want a currency can post
a buy order. Others browse the order book and match with one. The app does
**not** hold or transfer money — it only connects the two sides. Payment
happens directly between the two users, outside the app.

There are **two separate interfaces**:
- **User web app** — where students browse, post orders, trade, and chat.
- **Admin dashboard** — where admins verify identities and oversee the
  platform. Detailed in §6.

## 2. Tech Stack

- **User web app:** Next.js
- **Admin dashboard:** Next.js (can be a separate route group / separate
  deployment — Claude Code's choice)
- **Backend / database:** Supabase (Postgres + Auth + Storage + Realtime)
- **File storage:** Supabase Storage for passport photos (immutable, see §4)

## 3. Currencies

- Single currency pair only for v1: **Ouguiya (UM) ↔ Russian Ruble (RUB)**
- Keep the schema simple, but don't hardcode assumptions so hard that
  adding a second pair later requires a rewrite (store currency codes as
  fields, not as separate tables per currency).

## 4. User Roles & Verification Flow

- **Guest / unverified user:** can sign up and browse the order book freely.
  Cannot post or accept orders.
- **Verified + subscribed user:** can post orders, accept orders, chat, and
  trade.
- **Admin:** works entirely from the admin dashboard (§6).

### Flow

1. User signs up (email + phone) and can immediately browse the order book.
2. To unlock trading, the user submits:
   - WhatsApp number
   - A photo of their passport
3. On submission, the photo uploads **immediately** to the admin dashboard.
   Photos are **write-once**: no user or admin can delete them — this is a
   permanent audit trail.
4. User's status becomes `pending_verification`.
5. An admin manually reviews the submission from the dashboard (may contact
   the user directly via WhatsApp) and sets status to `verified` or
   `rejected`.
6. Only `verified` users with an active subscription can post or accept
   orders.

## 5. Order Book, Matching & Trades

Anyone verified can post either type of order:
- **Sell order:** "I have Ruble, want UM" (or vice versa) at a chosen rate
- **Buy order:** "I want Ruble, offering UM" (or vice versa) at a chosen rate

Both types live in the same order book, browsable by everyone (verified or
not — only verified, subscribed users can act on them).

**Trade flow:**
1. A verified user clicks an open order to start a trade → order **locks
   immediately** for everyone else.
2. A `trade` record links the order, poster, and acceptor.
3. Both parties use **in-app chat** to coordinate payment and confirm the
   transfer happened (money moves outside the app).
4. Each side clicks "confirmed" once they've verified they received/sent
   funds. When **both** confirm, the trade auto-closes as `completed`.
5. **Timeout:** if a trade sits locked with no confirmation for **30
   minutes**, it auto-releases back to `open`.
6. After completion, both users rate each other (star rating + optional
   comment), shown on profiles alongside completed-trade count.

## 6. Admin Dashboard — Detailed Functions

This is the operational core for running the platform day to day. Sections:

### 6.1 Verification Queue
- List of all users with status `pending_verification`, newest first
- Each row expands to show: WhatsApp number, passport photo (full-size
  viewable, **never deletable**), signup date, email, phone
- Actions per user: **Approve** / **Reject** (with optional rejection
  reason, stored and visible to the user)
- Search/filter by status (`unverified` / `pending_verification` /
  `verified` / `rejected`)
- Audit log per user: every status change, who made it (admin ID), and
  when

### 6.2 User Management
- Full searchable/sortable user list: name, email, phone, verification
  status, subscription status, rating, completed trades, join date
- Click into a user to see: full profile, order history, trade history,
  chat logs for their trades (for dispute resolution), ratings given and
  received
- Ability to suspend/ban a user (blocks login and trading, not a delete)
- Ability to manually mark a user as verified or adjust subscription status
  (for edge cases, e.g. manual payment confirmation)

### 6.3 Orders & Trades Overview
- Live table of all open orders (type, amount, rate, poster, posted time)
- Live table of active (locked) trades with a countdown to the 30-minute
  timeout
- Trade detail view: full chat transcript, confirmation status of both
  sides, linked order
- Filter by status: `open` / `locked` / `completed` / `cancelled`

### 6.4 Disputes / Support
- No formal in-app dispute workflow — but the dashboard should let an admin
  pull up any trade's full chat log and both users' contact info (WhatsApp)
  quickly, since disputes are resolved manually outside the app
- Simple internal note field per trade or user, so admins can log what was
  discussed/resolved

### 6.5 Platform Stats (simple overview page)
- Total users, verified users, pending verifications
- Total completed trades, total volume by currency
- Active subscriptions count

### 6.6 Access
- Admin accounts are separate from regular users (own auth/role), not just
  a flag on the `users` table used for login — keep admin auth isolated
  for security
- Only admins can access any dashboard route

## 7. Monetization

- Subscription fee required to post or accept orders (not a per-trade
  commission)
- Non-subscribers (even if verified) can browse but not trade
- Payment method for the subscription itself is **not yet decided** — flag
  as an open question before building that part

## 8. Interface Notes

### User web app
- **Order book page** (home): two clear lists or a toggle for "Buy orders"
  / "Sell orders", each showing amount, rate, poster's rating, and a
  "Trade" button
- **Post order**: simple form — type (buy/sell), amount, rate
- **Verification page**: WhatsApp number field + passport photo upload,
  with a clear "pending review" state shown after submission
- **Trade page**: chat thread + prominent "Confirm" button + countdown to
  the 30-min timeout + counterparty's rating visible
- **Profile page**: own rating, trade history, verification status,
  subscription status
- Should feel simple and trustworthy — clear status indicators
  (verified badge, rating stars, order status tags) matter more than
  decoration, since this is a trust-based marketplace

### Admin dashboard
- Standard admin layout: left sidebar nav (Verification Queue / Users /
  Orders & Trades / Stats), main content table/detail panel on the right
- Verification queue is the most-used screen — should be the default
  landing page for admins, with pending count badge in the nav
- Passport photos should open in a lightbox/full view, clearly marked
  read-only (no delete control anywhere in the UI)

## 9. Data Model (Supabase / Postgres)

### `users`
| column | type | notes |
|---|---|---|
| id | uuid | PK, from Supabase Auth |
| email | text | |
| email_verified | boolean | |
| phone | text | |
| phone_verified | boolean | |
| whatsapp_number | text | submitted at verification step |
| passport_photo_url | text | Supabase Storage URL, write-once |
| verification_status | text | `unverified` / `pending_verification` / `verified` / `rejected` |
| rejection_reason | text | nullable |
| display_name | text | |
| avg_rating | numeric | denormalized |
| completed_trades_count | integer | denormalized |
| subscription_status | text | `active` / `inactive` |
| subscription_expires_at | timestamptz | |
| is_suspended | boolean | |
| created_at | timestamptz | |

### `admins`
| column | type | notes |
|---|---|---|
| id | uuid | PK, separate auth from regular users |
| email | text | |
| name | text | |
| created_at | timestamptz | |

### `orders`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → users |
| type | text | `sell_um_for_ruble` / `sell_ruble_for_um` |
| amount | numeric | |
| rate | numeric | UM per Ruble |
| status | text | `open` / `locked` / `completed` / `cancelled` |
| created_at | timestamptz | |

### `trades`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | FK → orders |
| buyer_id | uuid | FK → users |
| seller_id | uuid | FK → users |
| amount | numeric | |
| rate | numeric | |
| status | text | `locked` / `completed` / `cancelled` |
| buyer_confirmed | boolean | |
| seller_confirmed | boolean | |
| locked_at | timestamptz | used for the 30-min timeout check |
| completed_at | timestamptz | |

### `chat_messages`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| trade_id | uuid | FK → trades |
| sender_id | uuid | FK → users |
| message | text | |
| created_at | timestamptz | |

### `ratings`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| trade_id | uuid | FK → trades |
| rated_by | uuid | FK → users |
| rated_user | uuid | FK → users |
| stars | integer | 1–5 |
| comment | text | optional |
| created_at | timestamptz | |

### `admin_audit_log`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| admin_id | uuid | FK → admins |
| user_id | uuid | FK → users, the user affected |
| action | text | e.g. `approved`, `rejected`, `suspended` |
| note | text | optional |
| created_at | timestamptz | |

## 10. Explicitly Out of Scope for v1

- In-app payment/escrow (money never touches the app)
- Multi-currency support beyond UM↔Ruble
- Formal in-app dispute/arbitration workflow (handled manually via
  WhatsApp, dashboard just surfaces the data)
- Student ID verification (passport + WhatsApp is the identity check)
- Native mobile app (web-first for v1)
