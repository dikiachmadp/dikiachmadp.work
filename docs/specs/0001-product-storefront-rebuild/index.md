# 0001. Digital product storefront rebuild

**Date**: 2026-09-02
**Status**: In Progress

## Summary

The product page and the product form both grew around a fixed template of eight
named landing sections. The one block a buyer most needs, what they actually get
for their money, is only reachable through the most optional section of all, so a
simple one file product cannot be published without filling in a pricing tier
table it does not have. This spec replaces the eight fixed slots with a short
list of ordered blocks, moves "what you get" onto the product itself, and splits
the admin form into two tabs so a simple product costs a fraction of the typing.
The database has zero products today, so the shape is redesigned rather than
migrated.

## Structure

This is an umbrella spec. Each child is sufficient on its own to build from.

- [0001 Content model](0001-content-model.md): the schema change, the block
  contract that replaces the eight slot landing object, and the data access
  layer that reads and writes it.
- [0002 Admin product form](0002-admin-product-form.md): two tabs and a global
  language switcher inside one form and one server action, plus the block
  builder.
- [0003 Product detail storefront](0003-product-detail-storefront.md): the
  detail page composition, the buy card, the six block renderers, and the
  catalog card.

**Cross child contract.** The block array is the single interface between the
three children. Its TypeScript and Zod definition lives in
`src/schemas/product-blocks.ts` and is imported by the DAL, the admin editor,
and the public renderers. No other module may define a block shape, and no
component may read `DigitalProduct.blocks` without going through that schema.

That module owns two exports all three children depend on: the block schema
itself, and `BLOCK_KIND_SPECS`, the per kind field descriptor table that replaces
`LANDING_SLOTS`. The descriptor table is contract, not implementation detail: it
is what lets the FormData parser, the image collector, the uploader, and the
editor walk a block generically instead of branching six ways each.

## Requirements

**User stories**:

- As the site owner, I want to publish a simple one file product with a cover, a
  price, and a list of what the buyer gets, without inventing pricing tiers, so
  that a small product costs a few minutes rather than an afternoon.
- As the site owner, I want the sales page sections to be blocks I add in the
  order I want, so that a complex product can say more without a fixed template
  deciding what it is allowed to say.
- As the site owner, I want to fill one language, copy it to the other, and
  adjust, so that publishing bilingually is one pass instead of two.
- As a visitor, I want the price, what I get, and the buy button visible without
  scrolling, so that I can decide quickly.

**Acceptance criteria** (the contract, each independently checkable):

- **AC-1**: A simple product (cover, price, one language, deliverables, zero
  blocks) can be created from nothing, and its detail page renders the gallery,
  the price, the deliverables list, and a working buy button with no block at
  all.
- **AC-2**: For that simple product, the Product tab shows fewer than 20 visible
  input controls in its default state, down from 55 on the current empty form.
- **AC-3**: Switching tab or language hides through the `hidden` attribute and
  never unmounts; one submit still carries both languages and both tabs.
- **AC-4**: The copy button fills the other language from the language currently
  active, for every text field in both tabs.
- **AC-5**: The owner can add, reorder, and delete blocks of all six kinds, and
  the order on screen is the order rendered on the public page.
- **AC-6**: An empty `demoUrl` renders no demo button at all, rather than a dead
  link.
- **AC-7**: A variant item with an empty `hex` does not block saving.
- **AC-8**: A failed validation returns every submitted value, including the
  `featured` and `pwywEnabled` checkboxes and every block.
- **AC-9**: `coverImage` and every `gallery` entry are rejected unless they are a
  public Supabase bucket URL or a root relative path, the same rule block images
  already pass.
- **AC-10**: The catalog card shows a fixed aspect ratio cover, a price badge
  over the image, a free marker when the price is zero, and the deliverables
  count on one line.
- **AC-11**: Every product mutation calls `revalidateProductPaths` with `slugs`
  and `previousSlugs` as applicable to that mutation: create passes `slugs`,
  delete passes `previousSlugs`, update passes both.
- **AC-12**: `npm run build` passes with `SKIP_DB_STATIC_GEN=1`.
- **AC-13**: An `Order` row created before this change still opens at
  `/{locale}/orders/{token}` with its receipt intact.

## Decision

**Chosen option**: Option 2: Core columns plus an ordered block list.

Replace `DigitalProduct.landing` (an object of eight optional named sections)
with `DigitalProduct.blocks` (an ordered array of typed blocks), promote the
buyer facing "what you get" list to `DigitalProductTranslation.deliverables`,
add `DigitalProduct.demoUrl`, and split the admin form into a Product tab and a
Sales page tab inside one form and one server action.

## Rationale

See [rationale.md](rationale.md) for the context, the options considered, the
reasoning, and the raw evidence from mapping the current form.

## Feature design

**Data model sketch** (one migration, no new table, so no hand written RLS
policy; table level policies from `20260818033632_add_digital_products` continue
to apply):

| Table                       | Change                                   |
| --------------------------- | ---------------------------------------- |
| `DigitalProduct`            | drop `landing Json`                      |
| `DigitalProduct`            | add `blocks Json @default("[]")`         |
| `DigitalProduct`            | add `demoUrl String?`                    |
| `DigitalProductTranslation` | add `deliverables String[] @default([])` |
| `Order`                     | untouched, no column added, none renamed |

The block contract, the six kinds, and the migration SQL are specified in
[0001 Content model](0001-content-model.md).

**State transitions**: unchanged. `status` stays `DRAFT` or `PUBLISHED`, and
`publishedAt` keeps its existing rule (set on first publish, cleared on draft).

**API surface**: no new HTTP route. The two existing server actions keep their
signatures and their pipeline (`requireUser` then Zod parse then upload then
transaction then revalidate).

| Action                               | Method        | Key inputs                                   | Key outputs                | Auth                      | Key errors                              |
| ------------------------------------ | ------------- | -------------------------------------------- | -------------------------- | ------------------------- | --------------------------------------- |
| `createProduct(state, formData)`     | server action | product fields, `blocks.*`, `translations.*` | `FormState`, then redirect | session + email allowlist | 422 field errors, upload size rejection |
| `updateProduct(id, state, formData)` | server action | same, plus `id`                              | `FormState`, then redirect | session + email allowlist | 422 field errors, 404 missing id        |

**Value sourcing** (every value an acceptance criterion needs, and where it
comes from):

| Action       | Value produced / displayed  | Source                                                                                                                                                        |
| ------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Save product | `blocks` JSON               | `FormData` keys `blocks.<i>.*`, parsed by `productBlocksSchema` in `product-blocks.ts`                                                                        |
| Save product | block `id`                  | `crypto.randomUUID()` in the editor when the block is added, carried through the hidden `blocks.<i>.id` input, then persisted unchanged                       |
| Save product | block `kind`                | the hidden `blocks.<i>.kind` input, which selects the item schema in `BLOCK_KIND_SPECS`                                                                       |
| Save product | number of blocks submitted  | the `blocks.<i>.present` sentinel, the pattern `landingFromForm` uses today                                                                                   |
| Save product | which fields hold an image  | `BLOCK_KIND_SPECS`, read by `blocksFromForm`, `uploadBlockImages`, and `blockImageUrls`                                                                       |
| Admin form   | the language shown on open  | decided here: `en` when creating, and when editing the first locale whose translation is non empty                                                            |
| Save product | `deliverables`              | `FormData` `translations.<locale>.deliverables`, split by `splitLines()` in `admin.ts`                                                                        |
| Save product | `demoUrl`                   | `FormData` `demoUrl`, validated by `isSafeLinkUrl()`                                                                                                          |
| Save product | `publishedAt`               | existing `digitalProductFormSchema` transform, unchanged                                                                                                      |
| Save product | uploaded image URLs         | `uploadImage()` in `src/lib/storage.ts`, unchanged                                                                                                            |
| Save product | orphaned images to delete   | `blockImageUrls(blocks)` in `product-blocks.ts`, replacing `landingImageUrls()`                                                                               |
| Detail page  | title, summary              | `DigitalProductTranslation` for the request locale, no fallback to `en`                                                                                       |
| Detail page  | deliverables list           | `DigitalProductTranslation.deliverables` for that locale                                                                                                      |
| Detail page  | "What you get" heading      | `ui.products.whatYouGet`, already present in both `ui.json` files                                                                                             |
| Detail page  | formatted price             | `formatPrice(price, currency)` in `src/lib/utils.ts`                                                                                                          |
| Detail page  | free marker                 | decided here: `price === "0"`, rendered as `ui.products.freeLabel`; `null` price shows no badge                                                               |
| Detail page  | demo button and its label   | `DigitalProduct.demoUrl` plus `ui.products.demoBtn`, already present                                                                                          |
| Detail page  | buy target                  | `polarProductId` when set, else `buyUrl`; unchanged from today                                                                                                |
| Detail page  | block background tone       | derived from the block's index in the array (alternating), never stored                                                                                       |
| Detail page  | anchor nav entries          | block `heading[locale]` for the label, block `id` for the fragment; rendered only when the locale has two or more publishable blocks                          |
| Detail page  | block visibility per locale | `localizeBlocks()` in `product-blocks.ts`: a block with an empty heading or no filled item in that locale is dropped, the rule `localizeLanding()` uses today |
| Catalog card | deliverables count          | length of that locale's `deliverables` array                                                                                                                  |
| Catalog card | cover aspect ratio          | decided here: fixed 4:3 via CSS, cover cropped with `object-fit: cover`                                                                                       |

**Key invariants**:

- `blocks` is always an array. A row whose JSON does not parse against the schema
  renders as zero blocks plus a `console.error`, never a crashed page. This is
  the fail soft rule `readLanding()` already implements.
- Every image URL in a product, cover, gallery, and inside any block, passes
  `isSafeImageUrl()`. Every link URL passes `isSafeLinkUrl()`.
- A product has at least one non empty translation, and at least one of
  `polarProductId` or `buyUrl`. Both refinements already exist and stay.
- Presentation is never stored: block order comes from the array, background
  tone and layout come from code.

**Security model**: unchanged. Writes are admin only, guarded by `requireUser`
plus the email allowlist. Public reads see published products only, through
`publishedWhere()`. No new table means no new RLS policy. No new external origin
means the CSP in `next.config.ts` is untouched, and no new file type reaches the
storage bucket.

**Configuration required**: none. No new environment variable, no new credential.

**Critical test scenarios**:

- Happy path: create a product with a cover, a price, English only, three
  deliverables, and zero blocks, then open its detail page, verifies **AC-1**.
- Happy path: add one block of each of the six kinds, reorder two of them, save,
  and confirm the public order matches, verifies **AC-5**.
- Failure case: submit with an invalid `coverImage` host and confirm every other
  value, both checkboxes and every block, survives the round trip, verifies
  **AC-8** and **AC-9**.
- Edge case: a variant item with an empty `hex` saves successfully, verifies
  **AC-7**.
- Edge case: a product with an empty `demoUrl` renders no demo button, verifies
  **AC-6**.
- Regression: an `Order` row that predates the migration still opens at
  `/{locale}/orders/{token}`, verifies **AC-13**.
- Form load: open the Product tab for a simple product and count the visible
  controls, verifies **AC-2**.
- Round trip: fill English, press copy to Indonesian, switch tabs and languages
  several times, then submit once and confirm both languages and both tabs
  arrived, verifies **AC-3** and **AC-4**.
- Catalog: render cards for a paid product, a zero priced product, and a product
  with no price set, verifies **AC-10**.
- Cache: rename a published product's slug and confirm both the old and the new
  path are revalidated, then confirm create and delete each revalidate the paths
  that apply to them, verifies **AC-11**.
- Build: `SKIP_DB_STATIC_GEN=1 npm run build`, verifies **AC-12**.

## Build plan

Tracer Bullet, two slices. Slice 1 is a thin thread through every layer for a
simple product; slice 2 thickens it.

**Slice 1, publishable simple product**

1. Write the migration directory, apply it with `npm run db:migrate` **before**
   deploying the code that reads `blocks`, and update `prisma/schema.prisma` to
   match, satisfies **AC-1**, **AC-13**.
2. Add `src/schemas/product-blocks.ts` with the block contract,
   `BLOCK_KIND_SPECS`, `localizeBlocks()`, `blockImageUrls()`, and the reused
   `isSafeLinkUrl()` and `isSafeImageUrl()`; delete
   `src/schemas/product-landing.ts` and its test, satisfies **AC-5**, **AC-7**,
   **AC-9**.
3. Update `src/lib/db/products.ts`: `readLanding` becomes `readBlocks`, `flatten`
   returns `blocks` and `deliverables`, `productData` writes `blocks` and
   `demoUrl`, `writeTranslations` writes `deliverables`, and `deleteProductById`
   collects image URLs from blocks, satisfies **AC-1**, **AC-11**.
4. Update `src/schemas/admin.ts`: `digitalProductFormSchema` gains `demoUrl` and
   `deliverables`, drops the `body` `min(1)` rule, validates `coverImage` and
   `gallery` with `isSafeImageUrl`, and `landingFromForm` becomes
   `blocksFromForm`, satisfies **AC-8**, **AC-9**.
5. Rebuild `ProductForm.tsx` as two tabs plus a global language switcher, with
   the Product tab complete and the Sales page tab a placeholder, hiding through
   `hidden` only, satisfies **AC-2**, **AC-3**, **AC-4**.
6. Rebuild the buy card and the gallery on the detail page: title and summary
   move into the card, deliverables render there, the demo button appears only
   when `demoUrl` is set, satisfies **AC-1**, **AC-6**.
7. Run `SKIP_DB_STATIC_GEN=1 npm run build` and open an existing order receipt,
   satisfies **AC-12**, **AC-13**.

**Slice 2, the full sales page**

8. Build the block builder in the Sales page tab: add, reorder, delete, six
   kinds, emitting the `blocks.<i>.id`, `blocks.<i>.kind`, and
   `blocks.<i>.present` hidden inputs, satisfies **AC-5**, **AC-8**.
9. Rewrite `uploadLandingImages()` in
   `src/app/(admin)/[locale]/dashboard/products/actions.ts` as
   `uploadBlockImages()`, walking `BLOCK_KIND_SPECS` to find pending files across
   the `comparison`, `variants`, and `gallery` image fields, satisfies **AC-5**,
   **AC-9**.
10. Rewrite the six block renderers and `ProductLanding.tsx` to walk the array in
    order with alternating tone derived from the index, satisfies **AC-5**.
11. Make `ProductAnchorNav` follow the blocks, rendering only when the locale has
    two or more publishable blocks, satisfies **AC-5**.
12. Rework `ui/ProductCard.tsx` for the fixed ratio cover, price badge, free
    marker, and deliverables count, satisfies **AC-10**.
13. Add the new copy keys to `src/content/en/ui.json`, `src/content/id/ui.json`,
    and `src/schemas/content.ts`, satisfies **AC-10**.

## Consequences

**Positive**:

- A simple product is publishable without touching the sales page tab at all,
  which was the whole complaint.
- "What you get" belongs to the product, so it no longer depends on a pricing
  tier existing.
- Three slots whose data shape was identical collapse into one kind with a style,
  removing three near duplicate editors and renderers.
- The block array makes order and repetition possible, which the eight fixed
  slots could not express.

**Negative / tradeoffs**:

- The fixed template guaranteed a sane page order; a block list lets the owner
  build an incoherent page. This is accepted deliberately: the same freedom is
  what makes a complex product possible.
- One destructive migration. It is safe only because the table is empty today,
  and that fact is what makes this the last cheap moment to do it.
- `blocks` is `jsonb`, so old rows keep their old shape when the code changes.
  The evolution rules that governed `landing` carry over verbatim: never rename a
  field, never recycle a meaning, add optional fields with defaults.
- Two tabs mean the form has state the DOM alone does not express, and every
  hide must stay a `hidden` attribute or values vanish from `FormData`.

**Neutral**:

- No new table, no new RLS policy, no new origin, no CSP change, no new
  environment variable.
- `Order` is untouched, so receipts and the Polar webhook are unaffected.
- `src/schemas/product-landing.ts` and its test disappear; the block schema
  inherits their URL safety helpers unchanged.

## Follow-up

- [ ] Related products and cross recommendations on the detail page.
- [ ] Clickable tags: `getPublishedProducts` already accepts a `tag` parameter
      and no UI sends one.
- [ ] Reviews and ratings.
- [ ] Release date and last updated date on the detail page.
- [ ] A visible breadcrumb, the JSON-LD one already exists.
- [ ] Refresh the product related `AGENTS.md` files after the build, which is
      `/sync`'s job, not this spec's.
