# Verify: digital product storefront rebuild · spec 0001 · updated 2026-09-02

_Steps derived from spec 0001 acceptance criteria and its Value sourcing table. `/check verify` runs these; `/test` locks the durable ones._

_Run 2026-09-02 by `/check verify`: 23 of 33 steps ran and passed._

_Run 2026-09-03 by `/debug`: the remaining 10 were run against four seeded
products on a local dev server, then the products were deleted again. Nine pass
and are ticked. The tenth (the over long Indonesian summary) cannot be run as
written and is rewritten below, because `summary` carries no length limit in the
schema; a missing Indonesian slug is used instead, which fails the same way and
tests the same marking. Four defects were found and fixed during the run: the
buy button called every fixed price product free, array errors reached no field
at all, `status` fell back to DRAFT after any rejected submit, and the block
layout select desynced from its own state._

_Run 2026-09-06 by `/check verify`: re-run end to end against a live dev server
and the real database. Twelve of the thirteen acceptance criteria were proved by
running the app: a product was created from an empty form, all six block kinds
were added, reordered, restyled and deleted, and the three price states were
rendered in both locales. Three test products were seeded and removed again, so
the database ends where it started (zero products, one order). Two things were
not re-run here. AC-11 could not be observed, because cache revalidation has no
visible effect under `next dev`; its three call sites were read and the suite
asserts them, so it rests on that rather than on runtime proof. The block image
fields were filled by writing the URL into the row, because the uploader needs a
real file picker. No defect was found._

## UI / manual

### The simple product, end to end

- [x] Open `/en/dashboard/products/new` → the Product tab is active, the language reads `EN`, and the Sales page tab is empty → AC-2, AC-3
- [x] Count the visible input controls on the Product tab before typing anything → fewer than 20 (expect 17: status, price, tags, featured, polarProductId, pwywMinAmount, pwywEnabled, coverImage, cover upload, gallery URLs, gallery upload, demoUrl, slug, title, summary, what you get, body) → AC-2
- [x] Fill English only: slug, title, summary, three lines under "What you get", upload a cover, set a price, set a Polar product ID. Add no block at all. Save → the product is created → AC-1
- [x] Open that product's public detail page → the gallery, the price, the "What you get" list, and a working buy button all render, with no section below them → AC-1
- [x] Confirm the page's `<h1>` is the product title **inside the buy card**, not a separate page header → AC-1

### Tabs, language, and the copy button

- [x] Fill English, switch the language to `ID`, fill a different title, switch back and forth twice, then save once → both languages arrive, and neither overwrites the other → AC-3
- [x] With the browser inspector open, switch tab and language → the inactive panel carries the `hidden` attribute and its inputs are still present in the DOM → AC-3
- [x] Fill English fully (both tabs, blocks included), press "Copy to Bahasa Indonesia" → every text field in the Product tab **and** every block heading, intro, and item text is filled in Indonesian → AC-4
- [x] Fill Indonesian with a title but no slug while the form is showing English → the `ID` language button is marked, the Product tab is marked, and the message is reachable without guessing → AC-3, AC-8

### Blocks

- [x] Add one block of each of the six kinds (list, comparison, variants, tiers, faq, gallery), fill each, save → all six render on the public page → AC-5
- [x] Move the second block above the first, save, reload the public page → the order on the page matches the order in the editor → AC-5
- [x] Delete a block, save → it is gone from the public page → AC-5
- [x] Set a `list` block's layout to each of points, cards, and specs → the public rendering changes accordingly → AC-5
- [x] With two or more blocks in a locale, check the anchor nav appears and each chip scrolls to its block; with one block, the nav does not render at all → AC-5
- [x] Save a product twice without touching its blocks → each block's `id` in the database is unchanged, so anchor links still resolve → AC-5
- [x] Confirm block backgrounds alternate plain, wash, plain… by position, and still alternate correctly after a reorder → AC-5

### The edges that break quietly

- [x] Leave `demoUrl` empty and save → the detail page renders no demo button, not a disabled or dead one. Then fill it → the button appears with the `demoBtn` label → AC-6
- [x] Add a variants block with an item whose colour is empty → it saves, and the public page renders no swatch for it (no black default box) → AC-7
- [x] Submit with an invalid `coverImage` host (e.g. `https://evil.example.com/x.png`) → the save is rejected, and every other value survives: both checkboxes (`featured`, `pwywEnabled`), every top level field, and every block with its items → AC-8, AC-9
- [x] Put a foreign host URL in one gallery line → rejected the same way as a block image → AC-9

### Catalog card

- [x] Render the catalog with three products: one priced above zero, one priced exactly `0`, one with no price set → the first shows the formatted price badge, the second shows the free marker in that same badge, the third shows no badge at all → AC-10
- [x] Check the cover is a fixed 4:3 crop and the deliverables count sits on one line, in both `en` and `id` → AC-10

### Value sourcing spot checks

- [x] Publish a product in `id` only → it appears at `/id/products` and does **not** appear at `/en/products` (no fallback to English) → AC-1
- [x] Fill a block's heading in `en` but leave it empty in `id` → the block renders on the English page and is dropped entirely on the Indonesian page → AC-5
- [x] Set price `0` and check both surfaces read the same: the catalog badge and the buy card both say the free label, never `$0` → AC-10
- [x] Set a price in a non USD currency and load both locales → the number formats per locale (`id-ID` vs `en-US`) and the currency symbol is the product's, not a hardcoded dollar → AC-10
- [x] Hand write an invalid shape into `DigitalProduct.blocks` for one row → its detail page still renders with zero blocks plus a `console.error`, never a crash → AC-1

## Commands

- [x] `SKIP_DB_STATIC_GEN=1 npm run build` → passes with no database reachable → AC-12
- [x] `npm test` → passes → AC-12
- [x] Open `/en/orders/{token}` for an `Order` row created before this migration → the receipt renders with its number, date, item, and total intact → AC-13
- [x] Rename a published product's slug and save → both the old and the new path are revalidated (check `revalidateProductPaths` receives `slugs` and `previousSlugs`) → AC-11
- [x] Create a product → `revalidateProductPaths` receives `slugs` only. Delete one → it receives `previousSlugs` only → AC-11
- [x] Delete a product that has block images → the bucket objects for the cover, the gallery, **and** every image inside its blocks are removed → AC-11

## Acceptance-criteria coverage

- AC-1 covered by the simple product steps plus the `id` only and malformed column checks
- AC-2 covered by the control count on an empty Product tab
- AC-3 covered by the tab/language round trip and the `hidden` attribute inspection
- AC-4 covered by the copy button step, which checks both tabs
- AC-5 covered by the six block steps: add, reorder, delete, style, anchors, stable ids, alternating tone
- AC-6 covered by the empty and filled `demoUrl` step
- AC-7 covered by the empty `hex` step, both saving and rendering
- AC-8 covered by the failed validation round trip and the marked language step
- AC-9 covered by the invalid cover host and the foreign gallery URL steps
- AC-10 covered by the three price states, the 4:3 crop, and the count line
- AC-11 covered by the rename, create, delete, and orphaned image steps
- AC-12 covered by the build and test commands
- AC-13 covered by the pre migration receipt step

## Steps this run added

Found while running the list above, on surfaces the acceptance criteria already
cover. Worth keeping.

- [x] Give a product a real price and open its detail page → the buy button
      reads the buy label, never the free one. Set the price to `0` → it reads
      the free label. Both, in `en` and `id` → AC-10
- [x] Give a product exactly one deliverable and one showcase image → the
      catalog card reads "1 item included" and the showcase reads "1 image",
      not the plural form → AC-10
- [x] Set the status to `PUBLISHED`, trigger any validation error, then submit
      again unchanged → the product saves as `PUBLISHED`, not silently as a
      draft → AC-8
- [x] Set a `list` block's layout, trigger any validation error, then submit
      again unchanged → the layout that was on screen is the layout that
      saves → AC-8
