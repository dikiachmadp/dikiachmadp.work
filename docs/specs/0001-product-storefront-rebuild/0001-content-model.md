# 0001a. Content model: core columns plus an ordered block list

Child of [0001 Digital product storefront rebuild](index.md). Satisfies
**AC-1**, **AC-5**, **AC-7**, **AC-9**, **AC-11**, **AC-13**.

## Why this shape

The product's essential content stops being optional. What every product has, a
cover, a price, and a list of what the buyer gets, lives in columns. What only
some products have lives in an ordered array of blocks in one `jsonb` column, the
same storage position `landing` occupied. No new table, so the table level RLS
policies from `20260818033632_add_digital_products` keep applying and nothing has
to be written by hand.

## Migration

The table is empty today (zero products, zero translations), so the change is
destructive by choice rather than by accident. `Order` is not touched.

Migrations in this project are applied by hand; the CLI path is often blocked. So
the migration directory carries this exact SQL and is applied with
`npm run db:migrate` (`prisma migrate deploy`), never `migrate dev`.

**Sequencing: migrate first, deploy second.** The new code cannot read a column
that does not exist yet, while the old code tolerates a column it does not know
about. Applying the SQL before the deploy therefore leaves no window where a
request can fail. Rollback is the reverse: redeploy the previous build first, then
restore `landing` if the column is ever needed again. With zero product rows
there is nothing to restore today, which is precisely why this is the moment.

```sql
ALTER TABLE "DigitalProduct" DROP COLUMN "landing";
ALTER TABLE "DigitalProduct" ADD COLUMN "blocks" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "DigitalProduct" ADD COLUMN "demoUrl" TEXT;
ALTER TABLE "DigitalProductTranslation"
  ADD COLUMN "deliverables" TEXT[] NOT NULL DEFAULT '{}';
```

Matching `prisma/schema.prisma` changes:

```prisma
model DigitalProduct {
  // ...
  demoUrl String?
  blocks  Json    @default("[]")
}

model DigitalProductTranslation {
  // ...
  deliverables String[] @default([])
}
```

`body` stays `String` and `NOT NULL` at the database level. Only the Zod
`min(1)` rule is dropped, so an empty string is a legal body. A product whose
whole story is told by its blocks does not need prose.

## The block contract

New module `src/schemas/product-blocks.ts`, replacing
`src/schemas/product-landing.ts`. It keeps that file's header rules verbatim:
never rename a field, never recycle a meaning, add new fields as optional with a
default, and if a breaking change is unavoidable write one script that rewrites
the column.

```ts
type Block = {
  id: string; // uuid, minted in the editor, stable forever
  kind: BlockKind; // one of the six below
  heading: { en: string; id: string };
  intro: { en: string; id: string };
  style?: "points" | "cards" | "specs"; // list blocks only
  items: BlockItem[]; // shape determined by kind
};
```

Six kinds:

| Kind         | Item fields                                                                                          | Replaces                           |
| ------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `list`       | `label`, `detail` (both localized)                                                                   | `positioning`, `features`, `specs` |
| `comparison` | `title`, `detail`, `beforeImage`, `beforeLabel`, `afterImage`, `afterLabel`                          | `proof`                            |
| `variants`   | `name`, `hex`, `description`, `image`, `linkUrl`                                                     | `variants`                         |
| `tiers`      | `name`, `price`, `priceNote`, `summary`, `includes`, `excludes`, `ctaLabel`, `ctaUrl`, `recommended` | `tiers`                            |
| `faq`        | `question`, `answer` (both localized)                                                                | `faq`                              |
| `gallery`    | `image`, `caption`                                                                                   | `gallery`                          |

Text fields stay localized `{ en, id }` pairs; images, colors, URLs, and booleans
stay single valued, so an image can never diverge between languages. Existing
per field length caps (`SHORT` 300, `MEDIUM` 1200, `LONG` 4000) and the item caps
(`MAX_ITEMS_PER_SECTION` 24, `MAX_LIST_ENTRIES` 20) carry over unchanged, plus a
new cap of **12 blocks per product**.

**`style` collapses three slots into one.** `positioning`, `features`, and
`specs` had identical field lists and differed only by `layout`. They become one
`list` kind whose `style` is `points`, `cards`, or `specs`.

## The descriptor table

`LANDING_SLOTS` was more than a form config: `landingImageUrls()`,
`landingItemFromForm()`, and `uploadLandingImages()` in `actions.ts` all walked it
to answer "what fields does this thing have, and which of them are images". Its
successor, `BLOCK_KIND_SPECS`, is part of this contract rather than an
implementation detail, because without it the six kinds get six hand written
branches in four different places, which is the duplication this spec claims to
remove.

```ts
export type BlockFieldSpec = {
  name: string;
  label: string;
  kind: "text" | "textarea" | "lines" | "image" | "url" | "color" | "flag";
  localized: boolean;
  hint?: string;
};

export type BlockKindSpec = {
  kind: BlockKind;
  label: string; // shown in the "add block" menu
  itemLabel: string;
  styles?: ("points" | "cards" | "specs")[]; // list only
  requires: string[]; // an item is empty when all of these are empty
  fields: BlockFieldSpec[];
};

export const BLOCK_KIND_SPECS: Record<BlockKind, BlockKindSpec>;
```

The field lists are the ones tabulated above, carried over from `LANDING_SLOTS`
verbatim; `requires` keeps each slot's existing emptiness rule. Four consumers
read this table and no one hand rolls a sixth: `blocksFromForm()`,
`uploadBlockImages()`, `blockImageUrls()`, and the block editor.

**Presentation is never stored.** Display order is array order. The alternating
background tone is computed from the block's index at render time, keeping the
rule that the owner supplies meaning and the code decides appearance.

**`hex` accepts empty.** The current `regex(/^#[0-9a-fA-F]{6}$/)` makes a color
mandatory on every variant. It becomes "empty, or that pattern", so a variant
that is a format rather than a color saves cleanly (**AC-7**).

## Reused from `product-landing.ts`

Moved across unchanged, not rewritten: `isSafeLinkUrl()`, `isSafeImageUrl()`,
`BUCKET_PATH_PREFIX`, the localized text helpers, and the length constants. Two
functions are ported with new names and the same behavior:

- `localizeLanding()` becomes `localizeBlocks(blocks, locale)`: flattens each
  `{ en, id }` pair to one language and drops any block whose heading is empty in
  that locale or whose items are all empty there, so a half translated product
  never shows a half finished block.
- `landingImageUrls()` becomes `blockImageUrls(blocks)`, walking every `image`
  kind field across all blocks, used by `deleteProductById` to clean the bucket.

`src/schemas/product-landing.ts` and `src/schemas/product-landing.test.ts` are
deleted once nothing imports them.

## Data access layer

All changes in `src/lib/db/products.ts`; the import ban keeps every read and
write here.

- `readLanding()` becomes `readBlocks()`, keeping the fail soft contract exactly:
  parse with the schema, and on failure log to `console.error` and return an
  empty array. A malformed row renders a product with no blocks, never a broken
  page.
- `flatten()` returns `blocks: LocalizedBlock[]` and `deliverables: string[]`,
  taking `deliverables` from the same translation row it already reads, so no
  extra query.
- `DigitalProductSummary` gains `deliverablesCount: number` for the catalog card
  (**AC-10**). The body and the blocks stay out of the summary, as today.
- `DigitalProductDetail` gains `demoUrl: string | null` and `deliverables`, and
  its `landing` field becomes `blocks`.
- `productData()` writes `blocks` and `demoUrl`; `writeTranslations()` writes
  `deliverables`.
- `deleteProductById()` collects orphaned images from `blockImageUrls()` instead
  of `landingImageUrls()`, then calls the existing `removeImages()`.
- Every mutation keeps calling `revalidateProductPaths({ slugs, previousSlugs })`
  exactly as it does now (**AC-11**).

## Validation moves

In `src/schemas/admin.ts`:

- `digitalProductFormSchema` swaps `landing: ProductLandingSchema` for
  `blocks: productBlocksSchema`, and gains `demoUrl` (validated with
  `isSafeLinkUrl`) and `translations.<locale>.deliverables` (parsed with the
  existing `splitLines()`).
- `coverImage` keeps `min(1)`, and now also passes `isSafeImageUrl`; every
  `gallery` entry does the same (**AC-9**). Today only images inside landing
  sections are checked, which is the inconsistency this closes.
- The `body` `min(1)` rule is removed.
- `landingFromForm()` becomes `blocksFromForm()`, reading `blocks.<i>.*` keys in
  index order.
- Both existing refinements stay: at least one translation, and at least one of
  `polarProductId` or `buyUrl`.

## Not in scope here

`Order` gains no column and loses none, so receipts issued before this migration
still resolve at `/{locale}/orders/{token}` (**AC-13**).
