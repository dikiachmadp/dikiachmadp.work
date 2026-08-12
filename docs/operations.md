# Operations

## Database

The Prisma schema is baselined against migration `0_init`, whose checksum is
already recorded in `_prisma_migrations`. `prisma migrate status` reports
"up to date" without running any DDL.

**Never run `prisma db push`, `prisma migrate dev`, or `prisma migrate reset`
against production.** Use `npm run db:migrate` (`prisma migrate deploy`) for new
migrations.

- `DATABASE_URL` — transaction pooler, port **6543**, used at runtime.
- `DIRECT_URL` — session pooler, port **5432**, used by the Prisma CLI for DDL.

`prisma/reconcile/sync-from-json.mjs` is a one-off script kept for the record:
it pushed the JSON content into the database before the public pages switched
to the DAL. It is idempotent but there is no reason to run it again.

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

Leaked-password protection should be enabled under Authentication → Policies.

## Environment

Nine variables, all validated at import by `src/lib/env.ts` and
`src/lib/env.public.ts`. A missing one is now a hard boot failure rather than a
degraded feature, so they must all be present in Vercel before deploying:

```
DATABASE_URL  DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL  NEXT_PUBLIC_SUPABASE_ANON_KEY
RESEND_API_KEY  RESEND_FROM_EMAIL  CONTACT_EMAIL
UPSTASH_REDIS_REST_URL  UPSTASH_REDIS_REST_TOKEN
```

`SKIP_DB_STATIC_GEN=1` is CI-only: it makes `generateStaticParams` return an
empty list so `next build` prerenders nothing and never needs a database.

## Storage

Project images live in the public `project-images` bucket. `docs/storage.sql`
documents the bucket policies; it is already applied and is kept as reference.
