<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# dikiachmadp.work

Bilingual portfolio and studio site. Public pages under `/{locale}`, an admin
dashboard behind `/{locale}/dashboard`, both reading the same Postgres database.

## Stack

- **Language / Runtime**: TypeScript 5, Node 22
- **Framework**: Next.js 16 (App Router) + React 19
- **Key dependencies**: Prisma 7 on Supabase Postgres, Supabase Auth (`@supabase/ssr`), Tailwind CSS v4, Zod 4, Polar (checkout), Resend (email), Upstash Redis (rate limiting)
- **Package manager**: npm · **Hosting**: Vercel, deploys on every push to `main`

## Build approach

Tracer Bullet (vertical slices, each feature built end to end through every layer, working).

## Commands

```bash
npm install            # Install
npm run dev            # Dev server
npm run build          # Prisma generate, then next build
npm test               # Vitest, node environment
npm run db:migrate     # Apply pending migrations (the only path to production DDL)

# What CI runs, in order
npm audit --audit-level=high && npm run lint && npm run format:check && npm run typecheck && npm test && npm run build
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`. Operations,
security, and database decisions are recorded in `docs/operations.md`; read it
before changing anything about migrations, CSP, auth, or Supabase settings.

## Rules

- All database access goes through the DAL in `src/lib/db/*`. ESLint blocks importing `@/lib/prisma` anywhere else.
- Server only modules open with `import "server-only"`: the DAL, env, auth, dictionary, storage.
- Environment variables are validated at import (`src/lib/env.ts`, `src/lib/env.public.ts`). A missing required one is a hard boot failure, not a degraded feature.
- Never run `prisma db push`, `prisma migrate dev`, or `prisma migrate reset`. Only `npm run db:migrate` may change the production schema.
- Public pages are statically generated with `revalidate = 3600`, so every mutation must call the matching helper in `src/lib/db/revalidate.ts`.
- Every route is locale prefixed. `src/proxy.ts` (Next 16's renamed middleware) does the locale redirect and the dashboard auth guard.
- A valid Supabase session is not authorization. `ADMIN_EMAILS` decides who is an admin, checked in three places, and it fails closed when empty.
- Form input is parsed with Zod before anything else happens, file uploads included.
- The CSP is enforced, not report only. A new external origin is a broken feature, not a console warning.
- Comments are Bahasa Indonesia in newer files and English in older ones. Match the file you are editing.
- CI builds with dummy credentials and `SKIP_DB_STATIC_GEN=1`, so every `generateStaticParams` must return `[]` when that variable is set. A build must never need a live database.
- Husky runs lint-staged on pre-commit: ESLint `--fix` plus Prettier over the staged files. A commit that fails lint never lands.

## Agent skills

- [supabase](.claude/skills/supabase/): `supabase/agent-skills`, Supabase auth, database, storage, and CLI guidance.
- [supabase-postgres-best-practices](.claude/skills/supabase-postgres-best-practices/): `supabase/agent-skills`, Postgres indexing, RLS performance, and pooling.

Workflow suite in `.claude/skills/`: architect, audit, check, debug, develop, document, scope, sync, test (`JavaScript-Mastery-Pro/skills`), pinned in `skills-lock.json`.
MCP servers: supabase (connected, see `.mcp.json`)

## Context files

- [prisma/AGENTS.md](prisma/AGENTS.md): schema, migration rules, and the commands that may touch production.
- [src/lib/db/AGENTS.md](src/lib/db/AGENTS.md): the data access layer every read and write goes through.
- [src/app/(admin)/AGENTS.md](<src/app/(admin)/AGENTS.md>): dashboard route group, server actions, and the auth gates.
- [src/content/AGENTS.md](src/content/AGENTS.md): per locale UI copy and how the dictionary is assembled.
- [src/components/AGENTS.md](src/components/AGENTS.md): theme tokens, client vs server split, and styling conventions.
- [src/app/[locale]/AGENTS.md](src/app/[locale]/AGENTS.md): public pages, static generation guards, and the 200 versus 404 rule.
- [src/app/api/AGENTS.md](src/app/api/AGENTS.md): route handlers, the guard order they share, and the Polar webhook.
- [src/lib/AGENTS.md](src/lib/AGENTS.md): env validation, Supabase clients, rate limiting, storage, and shared helpers.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
