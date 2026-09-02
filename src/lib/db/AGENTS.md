# Data access layer

## Overview

Every database read and write in the app goes through this folder. Pages,
components, server actions, and route handlers call these functions; none of
them import Prisma directly. The layer also owns the shape conversion between
Prisma rows (parent plus per locale translations) and the flat types the UI
components expect.

## Key files

| File                                        | Owns                                                    |
| ------------------------------------------- | ------------------------------------------------------- |
| `projects.ts`                               | Portfolio projects, plus their translations and gallery |
| `products.ts`                               | Digital product catalog and landing page sections       |
| `orders.ts`                                 | Polar orders, receipt tokens, currency normalisation    |
| `logbook.ts`                                | Blog posts, per language slugs, draft vs published      |
| `about.ts`                                  | About profile, skills, experience, certifications       |
| `testimonials.ts`, `contact.ts`, `stats.ts` | Smaller reads for the public pages and the dashboard    |
| `revalidate.ts`                             | The ISR invalidation helpers every mutation must call   |

## Conventions

- **Every file starts with `import "server-only"`.** This code must never reach
  a client bundle.
- **`@/lib/prisma` is off limits outside this folder.** ESLint enforces it
  (`no-restricted-imports` in `eslint.config.mjs`, with `src/lib/db/**` as the
  only exemption). If a page needs data, add a function here.
- Each read takes a `Locale` and returns the flat type from `@/types/content`.
  A private `flatten()` picks the matching translation and falls back to `en`.
- Category is stored as `categoryKey`, a key rather than a label. Labels live
  in the per locale JSON copy and are resolved at render time by
  `categoryLabel()` in `@/lib/categories`.
- Prisma `Decimal` must not leak into a Client Component prop. Serialize it to
  a string here; `formatPrice()` in `@/lib/utils` reads it back.
- JSONB columns (`contentBlocks`, landing sections) are validated on the way
  out, not cast blindly. Prisma types do not guarantee their shape.
- Tests sit next to the file they cover (`projects.ts` and `projects.test.ts`)
  and run under Vitest in the `node` environment.

## Gotchas

- **A mutation that skips `revalidate.ts` ships stale pages.** The public
  routes are statically generated with `revalidate = 3600`, so a change is
  invisible for up to an hour without an explicit call.
- **Logbook slugs differ per language**, so `revalidateLogbookPaths()` takes
  `{locale, slug}` pairs, and it needs `previousSlugs` too. Without the old
  pair, a renamed post keeps serving from its old URL and a deleted post stays
  alive at its old address.
- New content types that appear on the homepage or the sitemap need those
  paths added to their revalidate helper. `revalidatePath("/sitemap.xml")` is
  easy to forget and the omission only shows up on the next deploy.

## Related specs

Database and migration rules: [`prisma/AGENTS.md`](../../../prisma/AGENTS.md).

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
