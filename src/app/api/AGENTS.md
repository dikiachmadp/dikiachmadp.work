# Route handlers

## Overview

The three public HTTP endpoints that are not server actions: Polar checkout, the
contact form, and the `order.paid` webhook. All three take requests from outside
with no session behind them, so the order their guards run in (rate limit, body
size, validation) is the point of this folder, not an implementation detail.

## Key files

| File                     | Owns                                                        |
| ------------------------ | ----------------------------------------------------------- |
| `checkout/route.ts`      | Creates a Polar checkout session from a product slug        |
| `contact/route.ts`       | Stores a contact message and sends the Resend notification  |
| `polar/webhook/route.ts` | Receives `order.paid`, records the order, sends the receipt |

## Conventions

- **The guard order is always the same**: rate limit first
  (`getContactLimiter()` / `getCheckoutLimiter()` keyed by `clientIp()`), then
  the body size check, then `request.json()` and a Zod `safeParse`. Reversing it
  means expensive work runs for a request that was going to be rejected anyway.
- **Body size is checked by hand against `Content-Length`.** Route handlers have
  no built in limit; `serverActions.bodySizeLimit` in `next.config.ts` only
  covers server actions. A missing or unparseable header counts as a reject, not
  a pass.
- **Client facing errors stay opaque.** Zod issues are never returned as they
  are; the detail leaks the schema shape without helping a legitimate sender.
  The detail goes to `console.error` instead.
- **An unconfigured external service answers 503, not 500.** The Polar
  credentials are optional in `src/lib/env.ts`, so each route checks for itself
  (`isPolarConfigured()`, `env.POLAR_WEBHOOK_SECRET`) and the client side buy
  panel falls back to the external store link.
- Product identity always comes from the database by slug. `polarProductId`
  never comes from the request body.
- `src/proxy.ts` excludes `/api`, so nothing in here passes through the locale
  redirect or the auth guard.

## Gotchas

- **The database path and the email path are deliberately independent.** In both
  the contact route and the webhook each has its own `try` and swallows its
  error. The reason differs per route: in contact, the message is only truly
  lost when both paths fail (that is the one case that answers 500); in the
  webhook, throwing makes Polar retry a delivery that was already recorded.
- **The webhook must not read `request.json()` itself.** The `Webhooks` adapter
  from `@polar-sh/nextjs` verifies the signature over the raw body, and a body
  that has already been read makes that verification fail.
- **The receipt is guarded by `receiptSentAt`, not by "this row was just
  created".** It is marked after Resend accepts, never before, so a repeated
  webhook does not send a second email while a receipt that failed the first
  time still gets another chance.
- The `website` field on the contact form is a honeypot. When it is filled the
  answer is still 200, as if it worked, so bots do not learn the trap was spotted.
- `embedOrigin` on a checkout session must be `SITE_URL`, and the same host has
  to be allowlisted under Polar > Settings > Preferences > Embedding. Without
  that the checkout iframe is refused.

## Related specs

Response headers and CSP: [`docs/operations.md`](../../../docs/operations.md).
Order writes and receipt tokens: [`src/lib/db/AGENTS.md`](../../lib/db/AGENTS.md).

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
