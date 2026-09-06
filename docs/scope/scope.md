# Scope: dikiachmadp.work

Bilingual portfolio and studio site for a freelance designer and developer, with
a digital product store and an admin dashboard behind it. It serves prospective
clients, buyers of the digital products, and the owner who edits everything.

**Build approach:** Tracer Bullet (vertical slices, each feature built end to end through every layer, working).
**Workflow:** Beta (after `/develop`: `/check verify`, then `/test`). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· GA`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| #   | Feature                                   | Phase   | Status      |
| --- | ----------------------------------------- | ------- | ----------- |
| A   | Bilingual routing & locale copy           | Shipped | existing    |
| B   | Design system & theme                     | Shipped | existing    |
| C   | Data model & migrations                   | Shipped | existing    |
| D   | Data access layer                         | Shipped | existing    |
| E   | Admin auth & allowlist                    | Shipped | existing    |
| F   | Admin dashboard                           | Shipped | existing    |
| G   | Portfolio projects                        | Shipped | existing    |
| H   | Logbook                                   | Shipped | existing    |
| I   | About page                                | Shipped | existing    |
| J   | Digital product catalog & landing builder | Shipped | existing    |
| K   | On site checkout & pay what you want      | Shipped | existing    |
| L   | Orders, receipts & Polar webhook          | Shipped | existing    |
| M   | Contact form & submissions inbox          | Shipped | existing    |
| N   | Testimonials                              | Shipped | existing    |
| O   | Marketing & legal pages                   | Shipped | existing    |
| P   | SEO & structured data                     | Shipped | existing    |
| Q   | Security headers & rate limiting          | Shipped | existing    |
| R   | Coding standards & tooling                | Shipped | existing    |
| 3   | Digital product storefront rebuild        | Slice 1 | in-progress |
| 1   | Product analytics                         | Slice 2 | planned     |
| 2   | Error monitoring                          | Slice 2 | planned     |

## Shipped

Already built before this workflow existed, enrolled for context so later passes
know the ground they stand on. `/develop` and `/sync` leave these alone.

### A. Bilingual routing & locale copy · existing

Every route is locale prefixed, and all UI copy is per language JSON validated at load. code in `src/proxy.ts`, `src/content/`

### B. Design system & theme · existing

Hand drawn ink on paper look driven entirely by CSS custom properties, dark mode as the exact inverse. code in `src/components/`, `src/app/globals.css`

### C. Data model & migrations · existing

Thirteen models on Supabase Postgres, translatable content split into parent plus per locale child rows. Prisma owns the schema. code in `prisma/`

### D. Data access layer · existing

Every read and write goes through one folder, enforced by ESLint, including the ISR invalidation helpers. code in `src/lib/db/`

### E. Admin auth & allowlist · existing

Supabase sessions plus an email allowlist checked in three places, failing closed when empty. code in `src/lib/supabase/`, `src/app/(admin)/[locale]/login/`

### F. Admin dashboard · existing

Server action forms for projects, products, about, logbook, testimonials, orders, and submissions. code in `src/app/(admin)/`

### G. Portfolio projects · existing

Listing and detail pages with gallery, adjacent post links, and per locale translations. code in `src/app/[locale]/projects/`

### H. Logbook · existing

Blog with independent slugs per language, markdown content blocks, and a takeaways panel. code in `src/app/[locale]/logbook/`

### I. About page · existing

Database backed bio, skills, experience, and certifications with a dedicated editor. code in `src/app/[locale]/about/`

### J. Digital product catalog & landing builder · existing

Product listing plus a detail page whose landing sections are configured from the dashboard. code in `src/app/[locale]/products/`, `src/components/product/`

### K. On site checkout & pay what you want · existing

Embedded Polar checkout with tip presets, guarded by rate limiting and a server side product lookup. code in `src/app/api/checkout/`

### L. Orders, receipts & Polar webhook · existing

Signed `order.paid` webhook that records the order, notifies the owner, and emails a branded receipt exactly once. code in `src/app/api/polar/`, `src/app/[locale]/orders/`

### M. Contact form & submissions inbox · existing

Rate limited form with a honeypot, storing to the database and emailing on two independent paths. code in `src/app/api/contact/`

### N. Testimonials · existing

Client quotes managed from the dashboard and rendered on the public pages. code in `src/lib/db/testimonials.ts`

### O. Marketing & legal pages · existing

Services, studio, privacy, and legal pages built from locale copy. code in `src/app/[locale]/services/`, `src/app/[locale]/legal/`

### P. SEO & structured data · existing

Per locale metadata with canonical and alternates, sitemap, robots, PWA manifest, and JSON-LD. code in `src/app/sitemap.ts`, `src/components/seo/`

### Q. Security headers & rate limiting · existing

Enforced CSP with the reasoning recorded, plus four Upstash limiters keyed on the real client IP. code in `next.config.ts`, `src/lib/ratelimit.ts`

### R. Coding standards & tooling · existing

Six stage CI, ESLint with the DAL import ban, Prettier, husky pre commit, and the `AGENTS.md` context files. code in `.github/workflows/ci.yml`, `eslint.config.mjs`

## Slice 1: Storefront rebuild

The store already sells, but its content model works against it. The buy card's
"what you get" list is read from whichever pricing tier is flagged recommended,
so a product with one file and one price cannot look worth buying without
inventing a tier table it does not have. One vertical pass through the schema,
the admin form, and the public page.

### 3. Digital product storefront rebuild · in-progress

Publishing a simple product costs 55 form inputs and a pricing tier it does not need, and the detail page reads as an article rather than a shop. Make the typing proportional to the product, and put the purchase decision first.
**Done when:** a product with a cover, a price, one language, and a list of what the buyer gets can be published without opening the sales page tab at all, and a complex product can order its own sections.

spec [0001](../specs/0001-product-storefront-rebuild/index.md) · code in `src/schemas/product-blocks.ts`, `src/lib/db/products.ts`, `src/components/admin/`, `src/components/product/`, `prisma/migrations/20260902041500_product_blocks/`

- [x] Design it (spec): `/architect product storefront rebuild`
- [x] Build it: `/develop product storefront rebuild`
  - [x] Thin thread through every layer for a simple product: migration, block contract, data access layer, Product tab, new buy card - AC-1 to AC-4, AC-6 to AC-9, AC-11 to AC-13
  - [x] Thicken it: block builder, the six block renderers, anchor nav, catalog card - AC-5, AC-10
- [x] Verify it: `/check verify product storefront rebuild`
- [ ] Test it: `/test product storefront rebuild`

## Slice 2: Observability

Nothing measures this site and nothing reports its failures. Both strands run
end to end through the real app, narrow on purpose: a small set of events and
the errors that already happen, not a analytics platform.

### 1. Product analytics · needs a decision

Today every content and product decision is a guess. Know which pages are read, which products are viewed, and where visitors leave, in both locales.
**Done when:** page views plus a small named event set (product viewed, checkout started, contact submitted) are recorded for `en` and `id`, the numbers are reachable without touching code, and the choice either avoids a cookie banner or ships one with it.

- [ ] Design it (spec): `/architect product analytics`

### 2. Error monitoring · needs a decision

Production failures only reach Vercel logs, unread and without context. Several paths swallow their errors on purpose, so a real break can stay invisible for days.
**Done when:** an unhandled error in a page, server action, or route handler reaches you with stack, route, and locale; the deliberately swallowed errors in the contact route and the Polar webhook report too; and no visitor personal data leaves the app.

- [ ] Design it (spec): `/architect error monitoring`

## Deferred

Out of scope for this pass, kept so the plan stays honest.

- **Cookie consent & privacy compliance**: the legal page already names cookies but nothing asks the visitor · needs a decision · becomes required the moment analytics sets one
- **Accessibility audit**: pick a WCAG target, then fix focus, contrast, and keyboard gaps · needs a decision
- **Performance budget**: written Core Web Vitals targets and something that keeps them from slipping · needs a decision
- **Lead capture**: a service enquiry path sharper than the general contact form, and a newsletter · needs a decision
- **Content discovery**: category filters on projects, search on the logbook, indexable category pages · needs a decision
- **Store expansion**: buyer library, coupons, bundles, product reviews · needs a decision
- **Product page depth**: related products and cross recommendations, clickable tags (`getPublishedProducts` already takes a `tag` parameter that no UI sends), reviews and ratings, release and updated dates, a visible breadcrumb · from spec 0001 · needs a decision

## Legend

**The decision box.** Every feature carries exactly one, the sub task whose label ends with `(spec)`. Its wording varies, so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop` (or `/audit` for standards & tooling). The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre workflow) and `dropped` (de scoped, kept for history).
- **Approach tag** beside a heading (e.g. `· Facade`) overrides the project default for that feature; no tag = inherits it.
- **Workflow tier tag** beside a heading (e.g. `· GA`, `· Prototype`) sets that one feature's rigor above or below the project default; no tag inherits the default.
- **Workflow** (header line) is the project default, what runs after `/develop`: **Prototype** = nothing; **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`. A feature built on an unratified decision (an `Assumed` spec) stays flagged, but that never blocks `done`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
