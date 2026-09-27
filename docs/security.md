# Security & compliance · v15

## What changed from v14

| v14 | v15 |
| --- | --- |
| Owner PIN compared in the browser, `localStorage` flag | Server sessions (`StaffSession` rows, HttpOnly cookie, 12h), scrypt password hashes |
| Every `/api/*` mutation open | Every mutation behind `gate(req, permission)` · `lib/auth/rbac.ts` |
| Guest passwords stored as typed | scrypt hashes; legacy rows upgrade on next sign-in |
| Guest id in `localStorage`, `GET /api/users?id=` answered for any id | Signed HttpOnly guest cookie; `/api/account` answers only for its owner |
| `/book` downloaded every booking (names, phones) to price a stay | `/api/public/rates` · rooms, rules, packages only |
| Card number / expiry / CVC inputs on our page | Hosted Stripe Checkout (PCI SAQ-A); PromptPay QR; wire; Coinbase Commerce · no PAN ever reaches us |
| Passport numbers in plain columns | AES-256-GCM vault when `GUEST_VAULT_KEY` is set; reveal requires `guests:identity` and is audited |
| No audit | `AuditLog` on every staff/system mutation, identity reveal, channel event |
| No rate limits | Sliding-window limits on auth, booking, concierge, quote, webhooks |
| No security headers | HSTS, nosniff, frame options, referrer policy, permissions policy, CSP (report-only first) |

## Roles

`owner` · `manager` · `frontdesk` · `housekeeping`. The matrix is in
`lib/auth/rbac.ts`; the same table drives the sidebar, the route guard and the
API. Owners invite and deactivate staff on `/owner/settings`.

## Demo sandbox

With `DEMO_MODE=true` and no staff cookie the API treats the caller as a
sandbox owner, so the public demo and the acceptance suites keep working, and
the sidebar role switcher signs in as any seeded role to show the gating.
`AUTH_ENFORCE=true` removes the pass-through without touching anything else.
For a real property set both `DEMO_MODE` flags to `false`.

## Required production environment

```
SESSION_SECRET      long random string · signs guest cookies
GUEST_VAULT_KEY     32 bytes base64/hex · encrypts identity fields + channel secrets
STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET        cards, Apple Pay, Google Pay
COINBASE_COMMERCE_KEY / COINBASE_WEBHOOK_SECRET  crypto
CRON_SECRET         protects the cron endpoints
```

PromptPay ID and bank details are set by the owner on `/owner/settings` and
live on the Hotel row.

## PCI scope

Our pages never render a card field. Card, wallet and crypto payments redirect
to the provider's hosted page; the return is verified through a signed webhook
(`/api/payments/webhook/stripe`, `/api/payments/webhook/crypto`) before a
payment is marked settled. That keeps the deployment inside SAQ-A.

## Data vault

`lib/vault.ts` seals `{ passportId, nationality }` into `Booking.vault`; the
plain columns stay null. Staff without `guests:identity` see `AB••••89`;
`GET /api/bookings/[id]/identity` opens the vault for a permitted role and
writes an audit line naming who asked. Rotate the key by re-sealing rows with
the new key (a one-off script; the format is versioned `v1.`).

## Content Security Policy

Shipped as `Content-Security-Policy-Report-Only` because Next 14's inline
hydration scripts need a nonce pipeline before `script-src` can drop
`'unsafe-inline'`. Enforce it once nonces are wired through the root layout.
