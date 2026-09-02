# 0001c. Product detail page as a storefront

Child of [0001 Digital product storefront rebuild](index.md). Satisfies
**AC-1**, **AC-5**, **AC-6**, **AC-10**.

## Why this shape

The page currently reads as an article with a purchase option attached: title and
summary at the top of the document, then sections, with the buy card somewhere in
the flow and its "what you get" list borrowed from a pricing tier. A storefront
puts the decision first. Everything a buyer needs to say yes belongs in one card,
and the rest of the page exists to answer whatever doubt is left.

## Page composition

Top, above the fold:

- **Left**: the gallery, large, cover first, opening the existing lightbox.
- **Right**: the buy card, sticky, containing in this order the title, the
  summary, the price, the tags, the deliverables list under the existing
  `ui.products.whatYouGet` heading, the buy button, the demo button, and the
  assurance strip.

**Title and summary move into the buy card.** They stop being a page header,
because the card is what the buyer reads first and it should be self contained.
The title inside the card **is** the page's `<h1>`; it moves position, it does not
stop being the document heading. Losing the `<h1>` would cost both accessibility
and the SEO the metadata work already paid for.

Below:

1. The anchor nav, rendered only when the locale has **two or more** publishable
   blocks. One block does not need navigation.
2. The Markdown body, when it is not empty. It is optional now.
3. The blocks, in the owner's order, alternating background tone by index.
4. The closing CTA.

The sticky buy bar on small screens stays as it is.

## Deliverables and the demo button

The deliverables list comes from `DigitalProductTranslation.deliverables` for the
request locale. The `recommended` tier lookup in `BuyBox.tsx:37` is deleted; a
product with tiers still renders them as a `tiers` block, but the buy card no
longer depends on one existing (**AC-1**).

The demo button renders **only** when `demoUrl` is a non empty string. An empty
value renders nothing at all, not a disabled or dead link (**AC-6**). Its label
is the existing `ui.products.demoBtn` key.

## Block renderers

`ProductLanding.tsx` stops reading eight named slots and walks the array,
dispatching on `kind`:

| Kind         | Component                                                    |
| ------------ | ------------------------------------------------------------ |
| `list`       | `ListSection`, with `style` choosing points, cards, or specs |
| `comparison` | `ComparisonsSection` and `BeforeAfterSlider`                 |
| `variants`   | `VariantsSection`                                            |
| `tiers`      | `TiersSection`                                               |
| `faq`        | `FaqSection`                                                 |
| `gallery`    | `GallerySection`                                             |

All six keep `SectionShell` for the frame. `SectionShell` takes its tone from the
block's index rather than from a stored `tone`, so alternation stays correct no
matter how the owner reorders. Every block gets `id={block.id}` so the anchor nav
can target it.

`VariantsSection` renders no swatch element at all for an item whose `hex` is
empty, rather than an empty or defaulted colour box; the variant's name,
description, and image carry it. This is the render side of **AC-7**.

Localization is already decided upstream: `localizeBlocks()` in the DAL drops any
block that is empty in the request locale, so a renderer never receives a half
translated block.

## Catalog card

`src/components/ui/ProductCard.tsx`:

- Fixed **4:3** cover, cropped with `object-fit: cover`, taking a larger share of
  the card so the catalog reads as a shelf rather than a list of posts.
- One price badge over the image, never two: a price above zero renders
  `formatPrice()` from `src/lib/utils.ts`, a price of exactly `0` renders
  `ui.products.freeLabel` in that same badge, and a `null` price renders no badge
  at all, preserving the existing "not set" distinction.
- The deliverables count on one line, from `deliverablesCount` on the summary
  type.

## Styling and copy

Everything is built from the ink on paper custom properties already in
`src/app/globals.css`. No new external origin, so the CSP in `next.config.ts` is
untouched, and no new file type reaches the storage bucket.

Copy keys already present and reused: `ui.products.whatYouGet`,
`ui.products.demoBtn`, `ui.products.freeLabel`, `ui.products.buyBtn`,
`ui.products.galleryLabel`. Any new key must be added in four places per
`src/content/AGENTS.md`: `src/content/en/ui.json`, `src/content/id/ui.json`, the
Zod shape in `src/schemas/content.ts`, and wherever it is read.

## Reused, not rewritten

`formatPrice()` and `cn()` from `src/lib/utils.ts`; `createMetadata()` from
`src/lib/metadata.ts`; `productSchema()` and `breadcrumbSchema()` from
`src/lib/structured-data.ts`; `Markdown`; `ProductLightbox`,
`ProductGalleryShowcase`, `NaturalImage`, `AssuranceStrip`, `StickyBuyBar`,
`ClosingCta`; and the primitives in `src/components/ui/`.
