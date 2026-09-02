# 0001. Digital product storefront rebuild, decision record

The build spec is [index.md](index.md). This file holds the reasoning and the
evidence; a build never needs to load it.

## Context

The product detail page and the dashboard product form were both built around one
assumption: that a product's sales page is a fixed template of eight named
sections, filled in whichever subset applies. That assumption produced two
complaints, and mapping the code found a single cause behind both.

The buy card's "what you get" list is read from the `includes` array of whichever
tier is flagged `recommended` inside the **Paket** section, falling back to the
first tier when none is flagged (`tiers.find((t) => t.recommended) ?? tiers[0]`,
`src/components/product/BuyBox.tsx:37`). Either way the list exists only if a
tier does, so a product with a single price and no tiers gets no such list at
all. To make the page look worth buying, the
owner has to invent a pricing tier table for a product that has one price. The
single most important thing a buyer wants to know is stored in the most optional
place in the schema.

The form pays for the same assumption. It is one scrolling column of 14
fieldsets ending in one save button, and eight of those fieldsets belong to
sections most products will never use. Every text field is doubled for English
and Indonesian, so the cost of a rich product compounds fast.

The timing matters. The database currently holds zero products, zero
translations, and zero rows with `landing` populated, so nothing has to be
preserved and the shape can be redesigned instead of migrated. One `Order` row
does exist, holding an `orderNumber`, a `receiptToken`, and a snapshot
`productTitle`, so the `Order` table is treated as off limits: receipts already
issued must keep working. This is the last cheap moment to change the shape.

## Evidence from mapping the current form

Counting rule: a **visible input control** is a text input, textarea, select,
checkbox, or file picker rendered on screen. Hidden inputs and buttons are not
counted. Localized text fields count as two, one per language, because both are
rendered at once.

**Empty form, 55 visible inputs across 14 fieldsets**
(`src/components/admin/ProductForm.tsx`):

| Fieldset                 | Inputs | What they are                                           |
| ------------------------ | -----: | ------------------------------------------------------- |
| Publishing               |      5 | status, publishedAt, order, tags, featured              |
| Pricing & purchase       |      3 | price, currency, buyUrl                                 |
| On-site checkout (Polar) |      3 | polarProductId, pwywMinAmount, pwywEnabled              |
| Images                   |      4 | coverImage, cover upload, gallery URLs, gallery upload  |
| 8 landing sections       |     32 | heading and intro, each in two languages, 4 per section |
| English                  |      4 | slug, title, summary, body                              |
| Bahasa Indonesia         |      4 | slug, title, summary, body                              |
| **Total**                | **55** |                                                         |

**32 of those 55 inputs, well over half, are nothing but the headings and intros
of eight sections the product may not use.**

**Cost per item, by section** (from `LANDING_SLOTS` in
`src/schemas/product-landing.ts`):

|   # | Slot          | Legend        | Inputs per item | Why                                                          |
| --: | ------------- | ------------- | --------------: | ------------------------------------------------------------ |
|   1 | `positioning` | Posisi produk |               4 | label and detail, both localized                             |
|   2 | `proof`       | Bukti         |              10 | title, detail, two labels localized, plus two images         |
|   3 | `features`    | Fitur         |               4 | identical shape to `positioning`                             |
|   4 | `variants`    | Varian        |               7 | name and description localized, plus hex, image, link        |
|   5 | `tiers`       | Paket         |              16 | seven localized fields, plus ctaUrl and the recommended flag |
|   6 | `specs`       | Syarat        |               4 | identical shape to `positioning` and `features`              |
|   7 | `faq`         | Tanya jawab   |               4 | question and answer, both localized                          |
|   8 | `gallery`     | Galeri        |               3 | image plus a localized caption                               |

Slots 1, 3, and 6 have **byte for byte the same field list** (`listFields`); only
their `layout` differs, and `layout` is a code side presentation choice that is
never stored. Three separate slots exist for what is one shape with three looks.

**A reasonably filled product, 242 visible inputs.** Taking three positioning
points, two proofs, six features, three variants, three tiers, five specs, six
FAQ entries, and six gallery images:

| Section       | Items |  Inputs |
| ------------- | ----: | ------: |
| Base form     |     — |      55 |
| `positioning` |     3 |      12 |
| `proof`       |     2 |      20 |
| `features`    |     6 |      24 |
| `variants`    |     3 |      21 |
| `tiers`       |     3 |      48 |
| `specs`       |     5 |      20 |
| `faq`         |     6 |      24 |
| `gallery`     |     6 |      18 |
| **Total**     |       | **242** |

All of it in one scrolling column, behind one save button.

## Options considered

### Option 1: Keep the eight slots, patch the two symptoms

Add a `deliverables` field for the buy card and hide the unused sections behind
collapsed groups, leaving the slot model intact.

**Pros**:

- Smallest change, no migration, no risk to anything that already works.
- Fixes the specific "what you get" bug immediately.

**Cons**:

- Leaves three identical slots and their three near duplicate editors in place.
- Order and repetition stay impossible: a product cannot have two feature
  sections, or put proof above positioning.
- Collapsing sections reduces what is on screen, not what the model asks for. The
  form still poses eight questions to a product with one answer.

### Option 2: Core columns plus an ordered block list

Promote the buyer facing list to a column on the translation, add `demoUrl` to
the product, and replace the eight slot object with an ordered array of typed
blocks stored in the same `jsonb` column position.

**Pros**:

- The essential content lives in columns; the optional content lives in blocks.
  A simple product touches only the columns.
- Order, repetition, and omission all become expressible.
- The three identical slots collapse into one kind with a `style`.
- No new table, so no new RLS policy and no extra joins.

**Cons**:

- A destructive migration, safe only because the table is empty.
- The owner can now build an incoherent page, which the fixed template made
  impossible.
- `jsonb` still does not migrate itself, so the field evolution discipline
  carries over unchanged.

### Option 3: A relational `ProductBlock` table

Give each block its own row, with a type column and a `jsonb` payload.

**Pros**:

- Order is a real column, blocks are individually queryable, and per row
  constraints are possible.

**Cons**:

- A new table means new RLS policies written by hand, which the current design
  deliberately avoids.
- Blocks are never queried independently; they are always read whole with their
  product. The join buys nothing and costs a query.
- Writing a product becomes a diff of child rows instead of one column write.

### Option 4: Free form Markdown body only

Delete structured sections entirely and let the owner write the whole sales page
as Markdown.

**Pros**:

- The simplest possible model and the least code.

**Cons**:

- Presentation becomes the owner's problem on every product, and the ink on paper
  look stops being guaranteed.
- Per language structure is lost, so a partially translated product renders half
  broken instead of dropping a section.
- Comparison sliders, tier tables, and swatches cannot be expressed in prose.

## Rationale

Option 2 is chosen because it separates the two things the current model
conflated. What every product needs, a cover, a price, a list of what the buyer
gets, becomes a column that is always there and always cheap to fill. What only
some products need becomes a block the owner adds deliberately. That is the
difference between a form whose length matches the product and a form whose
length is fixed by the schema.

Option 1 was the tempting one, since it is nearly free, but it treats the
symptom. The reason a simple product is expensive is not that eight fieldsets are
expanded; it is that the model has eight questions and the product has one
answer. Collapsing them hides the cost without removing it.

Option 3 loses to the fact that no query ever reads a block on its own. A table
would buy queryability nobody needs and cost a hand written RLS policy, which the
whole schema has so far managed to avoid by keeping this data inside the product
row. Option 4 gives up the one thing the current design got right: the owner
supplies meaning and the code decides appearance, so no product can render badly.
Blocks keep that rule, they only make the sequence the owner's to choose.

A staged version of Option 1 was also weighed, and rejected: ship the additive
half now (add `deliverables` and `demoUrl`, collapse the eight fieldsets, leave
`landing` alone), and defer blocks to a second spec once real content proves the
six kinds are right. It is genuinely cheaper and lower risk, and it closes the two
loudest complaints. It loses on timing. The table is empty **today**; the same
destructive migration run after the store has products stops being free and
becomes a data migration with a rollback plan. The staged path also leaves the
form carrying both models at once, the eight slots and the new columns, which is
strictly more surface than either end state. Paying once, now, at zero data risk
beats paying twice later.

The freedom to build an incoherent page is accepted knowingly. It is the direct
cost of letting a complex product say what it needs to say, and a one person site
where the only author is the owner is exactly where that tradeoff is cheapest.

## References

**Project sources** (verifiable, in this repo):

- `src/components/product/BuyBox.tsx:37`, the `recommended` tier lookup that is
  the root of the "what you get" problem.
- `src/schemas/product-landing.ts`, the eight slot contract, its evolution rules
  for `jsonb`, and the URL safety helpers this spec reuses.
- `src/components/admin/ProductForm.tsx` and
  `src/components/admin/LandingSectionEditor.tsx`, the 14 fieldsets counted above.
- `prisma/schema.prisma`, the `DigitalProduct` and `DigitalProductTranslation`
  models, and the note on why `landing` is `jsonb` rather than a table.
- `prisma/migrations/20260818033632_add_digital_products`, where the table level
  RLS policies were established.
- `src/lib/db/AGENTS.md` and `src/content/AGENTS.md`, the data access and copy
  conventions this spec builds on.
- `docs/scope/scope.md`, feature J, which records the shipped catalog and landing
  builder this spec rebuilds.

**Practices & standards**:

- Store meaning, derive presentation: the rule already stated at the head of
  `product-landing.ts` and kept intact here.
- Fail soft on untyped storage: validate `jsonb` on read, log and degrade rather
  than crash the page.
- Allowlist by protocol and host for any user supplied URL that reaches an
  `href` or an `src`.
