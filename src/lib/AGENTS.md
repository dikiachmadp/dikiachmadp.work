# Shared server library

## Overview

The shared modules pages, components, server actions, and route handlers all
draw on: environment validation, Supabase clients, rate limiting, Storage, the
Polar client, the dictionary loader, plus pure helpers (slugs, pagination,
metadata, formatting). Database access has its own folder and its own rules in
[`db/AGENTS.md`](./db/AGENTS.md).

## Key files

| File                               | Owns                                                              |
| ---------------------------------- | ----------------------------------------------------------------- |
| `env.ts`                           | Zod schema for the server environment, throws at import           |
| `env.public.ts`                    | The two `NEXT_PUBLIC_*` vars, referenced literally so they inline |
| `admin-allowlist.ts`               | `parseAdminEmails()` and `isAdminEmail()`, read by three guards   |
| `supabase/{server,client,auth}.ts` | SSR client, browser client, and `requireUser()`                   |
| `ratelimit.ts`                     | `clientIp()` plus the four Upstash limiters                       |
| `storage.ts`                       | Image upload into the `project-images` bucket                     |
| `polar.ts`                         | Lazy Polar client, `isPolarConfigured()`, tip amounts             |
| `site-url.ts`                      | `SITE_URL`, the only source of the site origin                    |
| `dictionary.ts`                    | Assembles the `FullDictionary` from `src/content`                 |
| `upload-limits.ts`                 | The per file limit and the whole form limit                       |

## Conventions

- **Any module touching secrets or the database opens with
  `import "server-only"`**: `env.ts`, `ratelimit.ts`, `polar.ts`, `storage.ts`,
  `dictionary.ts`, `supabase/auth.ts`, and all of `db/`. The pure helpers client
  components import (`utils.ts`, `upload-limits.ts`, `pagination.ts`,
  `categories.ts`) deliberately do not, so do not add it to them.
- **External service clients are built lazily and reused**, never at module
  scope. `getRedis()`, `getPolar()`, and each limiter use the same `??=`
  pattern. Constructing at module scope makes the module throw at import time,
  far from the cause, and can break the build where the credentials genuinely do
  not exist.
- Required and optional environment variables are separated on purpose. The
  `optionalString` helper in `env.ts` treats an empty string as "not set",
  because `.optional()` alone only forgives `undefined`.
- The Polar credentials are optional while the rest are required. Each caller
  checks `isPolarConfigured()` before touching the API.
- Tests sit next to the file they cover (`ratelimit.ts`, `ratelimit.test.ts`)
  and run under Vitest in the `node` environment.

## Gotchas

- **`SITE_URL` must never come from a request header.** The origin is resolved
  from the environment (`SITE_URL`, then `VERCEL_ENV`/`VERCEL_URL`, then the
  canonical domain). Password reset links used to be built from the `Host`
  header, which the sender controls, so a request with a forged `Host` could
  make Supabase send a recovery link to an attacker's domain.
- **`clientIp()` takes only the first entry of `x-forwarded-for`.** That header
  is a list; using it whole means one client lands in different buckets and the
  rate limit allowance never runs out.
- **The `project-images` bucket is public.** File types are restricted to raster
  images and the extension is derived from the `content-type`, not from the file
  name the client sent, because HTML or SVG that slipped through would be
  executed by the browser as a page on a `*.supabase.co` domain.
- **There are two upload limits and both are needed.** `MAX_FILE_BYTES` (4 MB)
  is enforced server side in `uploadImage()`; `MAX_TOTAL_BYTES` (7.5 MB) mirrors
  `serverActions.bodySizeLimit` and has to be checked on the client, because a
  body over it is rejected by Next before the server action ever runs.
- **The `NEXT_PUBLIC_*` vars must be referenced literally** in `env.public.ts`.
  Dynamic access stops Next inlining their values into the browser bundle.
- `env.ts` accepts the `POSTGRES_*` vars from the Supabase and Vercel
  integration alongside its own `DATABASE_URL`/`DIRECT_URL`, and its own names
  win.

## Related specs

Environment, Storage, and auth hardening: [`docs/operations.md`](../../docs/operations.md).

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
