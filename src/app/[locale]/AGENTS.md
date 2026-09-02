# Public route group

## Overview

Everything a visitor sees: home, projects, products, logbook, about, services,
studio, contact, and the legal pages. All of it is statically generated with ISR
and reads the database through the DAL, so two things bind the whole folder:
queries must be skippable during a CI build, and every dashboard mutation has to
invalidate the right paths.

## Key files

| File                                             | Owns                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| `layout.tsx`                                     | `next/font` faces, `ThemeProvider`, navbar, footer, `revalidate = 3600` |
| `[...not-found]/page.tsx`                        | Catch all for junk URLs, plus the long note about the 200 status        |
| `error.tsx`, `loading.tsx`, `not-found.tsx`      | Error boundary, skeleton, and the per segment 404                       |
| `{projects,products,logbook}/[slug]/page.tsx`    | Detail pages, each with its own `generateStaticParams`                  |
| `src/app/sitemap.ts`, `robots.ts`, `manifest.ts` | Live above this group, not inside it                                    |

## Conventions

- **Every `generateStaticParams` opens with the `SKIP_DB_STATIC_GEN` guard.** CI
  builds with dummy credentials, so without it `next build` tries to query a
  database that is not there. Any new page reading the database has to follow
  the same pattern.
- `revalidate = 3600` in the layout is a safety net, not the main mechanism.
  What actually makes a change visible is the helper in
  `@/lib/db/revalidate.ts` that the dashboard server actions call.
- The locale is validated in each page with the same shape
  (`locale === "id" ? "id" : "en"`), then passed to `getDictionary()` and to the
  DAL functions. No page trusts the raw param.
- Metadata is built through `createMetadata()` in `@/lib/metadata` rather than a
  hand written `Metadata` object, so the canonical URL and the per language
  alternates stay consistent.
- Server components by default. Only two files in this group use
  `"use client"`; other interactivity belongs in `src/components/interactive/`.
- Pages do not import copy themselves. Text comes from `getDictionary()` in the
  page and flows down to components as props.

## Gotchas

- **A "not found" page here answers 200, not 404, and that cannot be changed
  from here.** Once the response starts streaming (and `loading.tsx` in the
  parent segment triggers that), the headers are already sent. What keeps a
  mistyped URL out of the index is `robots: { index: false }` in the metadata,
  not the status number. Do not remove that line from any detail page.
- **Logbook slugs differ per language.** The English and Indonesian versions of
  one post do not share a URL, so never derive one from the other.
- `generateMetadata` and the page component both call the DAL. Use
  `Promise.all`, the way the existing detail pages do, rather than sequential
  awaits.
- The origin for absolute links comes from `SITE_URL` or `siteConfig.url`, never
  from a request header.
- New content that shows on the home page or the sitemap means adding those
  paths to its revalidate helper. `revalidatePath("/sitemap.xml")` is easy to
  miss and the omission only shows up on the next deploy.

## Related specs

Revalidation rules: [`src/lib/db/AGENTS.md`](../../lib/db/AGENTS.md).
Theme tokens and the client versus server split: [`src/components/AGENTS.md`](../../components/AGENTS.md).

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
