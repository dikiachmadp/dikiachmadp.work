# Prisma schema and migrations

## Overview

Owns the database schema, the migration history, and the generated Prisma
client. Supabase Postgres is the database, but Prisma owns the schema: there is
no `supabase/migrations/` directory and the Supabase GitHub integration is off
on purpose. `docs/operations.md` is the long form record of why.

## Key files

| File                       | Owns                                                           |
| -------------------------- | -------------------------------------------------------------- |
| `prisma/schema.prisma`     | All 13 models plus the `PostStatus` and `AboutEntryKind` enums |
| `prisma/migrations/`       | Applied SQL, baselined at `0_init`                             |
| `prisma/generated/prisma/` | Generated client, git ignored, rebuilt by `prisma generate`    |
| `prisma.config.ts`         | Points the CLI at `DIRECT_URL` (session pooler, 5432)          |

## Commands

```bash
# Apply pending migrations (the only path allowed to change production)
npm run db:migrate

# Generate the SQL for a new migration
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```

## Conventions

- Two connection strings, on purpose. `DATABASE_URL` is the transaction pooler
  (port 6543) used at runtime; `DIRECT_URL` is the session pooler (port 5432)
  used by the CLI for DDL.
- Translatable content is split into a parent row plus a `*Translation` child
  keyed by `locale`. Anything not language specific (slug, dates, images,
  category key) stays on the parent.
- Migration folders are named `<timestamp>_<snake_case_name>`.
- The generated client is written to `prisma/generated/prisma`, not
  `node_modules`. Import types from `@/../prisma/generated/prisma/client`.

## Gotchas

- **Never run `prisma db push`, `prisma migrate dev`, or `prisma migrate
reset`.** Only `prisma migrate deploy` (`npm run db:migrate`) may touch the
  production schema.
- **Read what `migrate diff` produced before you save it.** It compares the
  live database against the schema, so anything present in the database but
  absent from `schema.prisma` comes back as a `DROP TABLE`. The command cannot
  tell "not modelled yet" from "meant to be deleted".
- **A new table needs its own RLS block in the migration SQL.** `migrate diff`
  does not generate policies, and a table without one is readable through the
  Supabase Data API by anyone holding the anon key, which ships in the browser
  bundle. Copy the pattern from `0_init` or `20260815040845_add_logbook`.
- Prisma 7 renamed the diff flags. `--from-schema-datasource` and
  `--to-schema-datamodel` were removed; use `--from-config-datasource` and
  `--to-schema`.
- Three `rls_enabled_no_policy` advisories are accepted, not bugs. See the
  accepted advisories section in `docs/operations.md` before "fixing" one.

## Agent skills

- [supabase](../.claude/skills/supabase/): `supabase/agent-skills`, Supabase
  auth, database, storage, and CLI guidance.
- [supabase-postgres-best-practices](../.claude/skills/supabase-postgres-best-practices/):
  `supabase/agent-skills`, Postgres indexing, RLS performance, and pooling.

MCP servers: supabase (connected, see `.mcp.json`)

## Related specs

Operations record: [`docs/operations.md`](../docs/operations.md).

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
