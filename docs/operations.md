# Operations

## Database

The Prisma schema is baselined against migration `0_init`, whose checksum is
already recorded in `_prisma_migrations`. `prisma migrate status` reports
"up to date" without running any DDL.

**Never run `prisma db push`, `prisma migrate dev`, or `prisma migrate reset`
against production.** Use `npm run db:migrate` (`prisma migrate deploy`) for new
migrations. `prisma migrate deploy` is the only path that may change the
production schema — that includes tooling, which is why the Supabase GitHub
integration is off (see below).

- `DATABASE_URL` — transaction pooler, port **6543**, used at runtime.
- `DIRECT_URL` — session pooler, port **5432**, used by the Prisma CLI for DDL.

### Writing a new migration

Change `schema.prisma`, then generate the SQL:

```
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```

Save it as `prisma/migrations/<timestamp>_<name>/migration.sql` and apply with
`npm run db:migrate`. Prisma 7 renamed these flags: `--from-schema-datasource`
and `--to-schema-datamodel`, which older notes in this repo still mention, were
removed.

**Read what the diff produced before you save it.** It compares the live
database against the schema, so anything in the database that is absent from
`schema.prisma` comes back as a `DROP TABLE` — the command has no way to tell
"not modelled yet" from "meant to be deleted". Until 2026-08-15 this repo had
ten legacy snake_case tables that made the diff propose ten drops every single
time; they are gone now (`20260815045258_drop_legacy_tables`) and the diff is
clean, but the rule stands for anything created outside Prisma later.

New tables also need their own RLS block — see `0_init` and
`20260815040845_add_logbook`. `migrate diff` does not generate policies, and a
table without one is readable through the Supabase Data API by anyone holding
the anon key, which ships in the client bundle.

`prisma/reconcile/sync-from-json.mjs` is a one-off script kept for the record:
it pushed the JSON content into the database before the public pages switched
to the DAL. It is idempotent but there is no reason to run it again.

## Supabase GitHub integration — disabled, keep it that way

Supabase Branching was connected to this repo. It was **switched off on
2026-08-14**. Do not reconnect it.

Branching exists to apply migrations from a repo to the project. This repo does
not work that way: the schema is owned by Prisma (`prisma/migrations/0_init`,
baselined — see above), and there is no `supabase/migrations/` directory for
Branching to read. The two had already drifted:
`supabase_migrations.schema_migrations` listed `v2_initial_schema` and
`v2_harden_function_search_path`, neither of which matches the Prisma baseline.

That made the integration a second, unsupervised DDL path into production —
precisely what the warning at the top of this file exists to prevent.

It surfaced as a red **"Supabase Preview"** check on the merge of PR #6:

```
unexpected status 403: {"message":"Endpoint does not support branching tokens"}
```

Nothing was wrong with that merge, and the message is easy to misread as an
application fault. The same check passed on PR #5 fourteen minutes earlier; PR
#6 touched no schema, no migration and no Supabase setting; CI and the Vercel
deploy both passed; the public site served every route cleanly. The database was
intact throughout — `0_init` finished, nothing unfinished, all 15 tables
present.

A leftover branch record (`git_branch: main`, `status: MIGRATIONS_FAILED`) can
still appear in `list_branches` after disconnecting. It is inert. What actually
confirms the integration is gone is that a push to `main` no longer produces a
"Supabase Preview" check at all.

## Keep-alive

Supabase free tier pauses a project after ~7 days of inactivity. Since the
public pages now read from the database, a paused project takes the **site**
down, not just the dashboard.

`.github/workflows/keep-supabase-alive.yml` pings every 3 days. It needs a
`DATABASE_URL` repository secret — use the **session pooler (5432)** value.
The script prints only the database name and a timestamp, never the connection
string.

`export const revalidate = 3600` in the locale layout means a trafficked site
also touches the database hourly, but the cron is the reliable path.

## Accepted Supabase advisories

Three `rls_enabled_no_policy` notices are intentional and should not be
"fixed":

- `public.ContactSubmission` — RLS on with zero policies is deny-all through
  PostgREST. Prisma connects as `postgres` and bypasses RLS, so the app is
  unaffected. Adding a policy here would expose submissions to the Data API.
- `public._prisma_migrations` — Prisma-managed.
- `backup.*` — snapshot tables, not reachable by the app.

The `auth_leaked_password_protection` warning is also expected and will not
clear. Checking new passwords against HaveIBeenPwned is a paid-plan feature and
this project is on the free tier, so there is nothing to enable. Treat it as
accepted, not outstanding.

## Auth hardening

Who counts as an admin is decided by `ADMIN_EMAILS`, not by Supabase. The anon
key ships to the browser, so any account that manages to sign up holds a valid
session — a session proves identity, never authority. The allowlist is checked
in three places on purpose (`src/lib/admin-allowlist.ts`):

- `src/proxy.ts` — the middleware guard on `/{locale}/dashboard`
- `src/lib/supabase/auth.ts` — `requireUser()`, used by every admin page and
  server action
- `src/app/(admin)/[locale]/login/actions.ts` — rejects at sign-in so a
  non-admin session is never issued

An empty or missing `ADMIN_EMAILS` fails closed everywhere.

These settings live in the Supabase dashboard and cannot be enforced from the
repo. Re-check them after any project change:

- Authentication → Sign In / Providers → **"Allow new users to sign up" off**.
  Left on, anyone can create an account; the allowlist is what stops them from
  reaching the dashboard, but there is no reason to hand out sessions at all.
- Authentication → Users → only known admin accounts.
- Authentication → URL Configuration → Redirect URLs listed explicitly
  (`https://dikiachmadp.work/**`), never a loose wildcard. Password-reset links
  are built from `SITE_URL`, and this list is the second lock on where a
  recovery token may land.

Verified 2026-08-14: signup off, one account in `auth.users`. Both are readable
without the dashboard — `GET /auth/v1/settings` with the anon key reports
`disable_signup`, and `select email from auth.users` covers the second. The
redirect URL list has no read path short of the Management API, so it is the
one item that can only be eyeballed.

## Environment

Eleven variables, all validated at import by `src/lib/env.ts` and
`src/lib/env.public.ts`. A missing one is now a hard boot failure rather than a
degraded feature, so they must all be present in Vercel before deploying:

```
DATABASE_URL  DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL  NEXT_PUBLIC_SUPABASE_ANON_KEY
ADMIN_EMAILS  SITE_URL
RESEND_API_KEY  RESEND_FROM_EMAIL  CONTACT_EMAIL
UPSTASH_REDIS_REST_URL  UPSTASH_REDIS_REST_TOKEN
```

`ADMIN_EMAILS` is a comma-separated list and is required. `SITE_URL` is
optional (`src/lib/site-url.ts` falls back to the production domain on Vercel
and to localhost in dev) but should be set explicitly in production.

`SKIP_DB_STATIC_GEN=1` is CI-only: it makes `generateStaticParams` return an
empty list so `next build` prerenders nothing and never needs a database.

## Storage

Project images live in the public `project-images` bucket. `docs/storage.sql`
documents the bucket policies; it is already applied and is kept as reference.

The bucket is public and Supabase serves objects with the `content-type` they
were stored under, so an HTML or SVG upload would execute as a page on the
`*.supabase.co` origin. `src/lib/storage.ts` therefore accepts only
`image/jpeg`, `image/png`, `image/webp`, and `image/avif`, caps files at 4 MB,
and derives the stored extension from the MIME type rather than from the
client-supplied filename. Deleting a project also deletes its objects.

## Response headers

`next.config.ts` sets HSTS, `X-Frame-Options: DENY`, `nosniff`,
`Referrer-Policy`, and `Permissions-Policy` on every route.

The CSP is now **enforced** (`Content-Security-Policy`, no longer report-only).
`object-src 'none'`, `base-uri`, `form-action`, `frame-ancestors 'none'`, and
the `connect-src`/`img-src` restrictions all bind. `'unsafe-eval'` is dev-only —
React needs it there to reconstruct server error stacks in the browser.

**`'unsafe-inline'` in `script-src` stays, deliberately.** Dropping it requires
nonces, and per `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`
nonces force **every page to render dynamically — static generation and ISR are
disabled**. That would void `revalidate = 3600`, every `generateStaticParams`,
and the whole `revalidateProjectPaths()` flow, and put a Supabase query on every
single visit — to the same free-tier database the keep-alive cron exists to
protect. The XSS-inline hardening is not worth that here. `style-src` needs
`'unsafe-inline'` regardless: the components carry dozens of JSX `style`
attributes, which nonces do not cover.

Because the header binds now, a CSP violation is a broken feature, not a console
note. After changing anything that loads a script, font, image, or media file,
walk the public routes and the dashboard with the console open and confirm it
stays clean.
