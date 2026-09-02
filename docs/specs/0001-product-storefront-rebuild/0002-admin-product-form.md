# 0001b. Admin product form: two tabs, one submit

Child of [0001 Digital product storefront rebuild](index.md). Satisfies
**AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-8**.

## Why this shape

The form's cost is fixed by the schema rather than by the product. 14 fieldsets
in one scrolling column, 55 visible inputs before a single word is typed, and 32
of those are the headings and intros of eight sections most products never use.
Splitting the form into what every product needs and what only some products need
makes the typing proportional to the product.

## Structure

**One `<form>`, one server action, two tabs.** The pipeline stays exactly as it
is: `requireUser`, Zod parse, upload, transaction, revalidate. Tabs are a view
concern only, so nothing about submission changes.

- **Tab 1, Product**: status, publishing, price, Polar, images, deliverables,
  demo link, and per language text.
- **Tab 2, Sales page**: the block builder, with an "add block" menu.

A **global language switcher sits above the tabs**, not inside them, with a copy
to the other language button beside it (**AC-4**). Both tabs honor it, so the
owner picks a language once and fills the whole product in it.

## The binding implementation constraint

**Tab switching and language switching must hide with the `hidden` attribute, and
must never unmount** (**AC-3**).

The top level fields are uncontrolled DOM inputs (`defaultValue`), which is how
`FormState` restores values after a failed validation. An unmounted input is not
in the DOM, and an input that is not in the DOM is not in `FormData`. Unmounting
the inactive tab or language would silently drop half the product on submit.

Blocks are different and already are: they live in React state, because a picked
but not yet uploaded `File` cannot live in the DOM and React resets the form after
every server action. That existing pattern in `LandingSectionEditor` carries over
to the block builder unchanged.

## Tab 1: Product

Grouped, with the rarely touched fields in a collapsed `<details>` group so the
default view stays short. Collapsed is still mounted, so the constraint above
holds.

| Group                 | Fields                                                 | Visible by default |
| --------------------- | ------------------------------------------------------ | ------------------ |
| Status & price        | status, price, tags, featured                          | yes                |
| Checkout              | polarProductId, pwywEnabled, pwywMinAmount             | yes                |
| Images                | coverImage, cover upload, gallery URLs, gallery upload | yes                |
| Links                 | demoUrl                                                | yes                |
| Per language (active) | slug, title, summary, deliverables, body               | yes                |
| Advanced              | publishedAt, order, currency, buyUrl                   | collapsed          |

Default visible count for a simple product: **17 controls**, comfortably under
the 20 of **AC-2** and down from 55. The four advanced fields are scheduling,
catalog ordering, a currency that is USD on every product, and the legacy
external store URL, none of which a normal product touches.

`deliverables` is one textarea per language, one item per line, parsed with the
existing `splitLines()`, matching how tier `includes` is already edited.

## Tab 2: Sales page

An "add block" menu offering the six kinds, then a list of block cards. Each
card carries the block's heading and intro for the active language, its items,
move up and move down buttons, and delete. `list` blocks also carry a style
selector (`points`, `cards`, `specs`).

Ordering follows `GalleryEditor`'s established pattern: indexed field names
(`blocks.2.items.0.label.id`), so the order on screen is the order submitted and
a Zod error path maps straight onto an input name. Move buttons rather than drag,
because dragging needs a mouse.

Blocks are capped at 12 per product, items at 24 per block, matching the existing
`MAX_ITEMS_PER_SECTION`.

## The FormData contract for blocks

The eight slots had fixed keys (`landing.positioning.items.0.label.en`), so the
parser knew what it was reading from the key alone. Blocks are positional
(`blocks.<i>.…`) and their shape varies, so three hidden inputs per block carry
what the key no longer says:

| Hidden input         | Why it exists                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blocks.<i>.id`      | The uuid is minted once and must survive the round trip. Without this input every save mints a new id, breaking anchor links and the block's identity. |
| `blocks.<i>.kind`    | Selects which item schema in `BLOCK_KIND_SPECS` parses this block.                                                                                     |
| `blocks.<i>.present` | Marks the index as occupied, so the parser knows where the array ends. This is the same sentinel `landingFromForm` already uses for items.             |

Item level fields keep the existing indexed naming
(`blocks.2.items.0.label.id`), so a Zod error path still maps directly onto an
input name.

## Which language opens first

Deciding this matters because **AC-2**'s ceiling only holds while one language is
rendered at a time.

- Creating a product: `en`.
- Editing a product: the first locale whose translation is non empty, so an
  Indonesian only product opens in Indonesian rather than on five empty fields.

## Error and value round trip

`FormState` is unchanged, and so is its contract: on a failed parse the action
returns `values` and `fieldErrors`, and every input reads its value back from
`state.values` before falling back to the saved record (**AC-8**).

Two things that must be handled explicitly, because a plain uncontrolled input
gets them wrong:

- Checkboxes: `featured` and `pwywEnabled` are absent from `FormData` when
  unchecked, so their restored state comes from `state.values`, not from the
  record.
- Blocks: they round trip through React state, seeded from `state.values` on a
  failed submit rather than from the database record.

A field error must never be invisible behind a control that hides it. Three
markers, all required: the tab button is marked when its tab holds an error, the
language switcher is marked for a language that holds one, and a collapsed
`<details>` group is opened automatically when it contains one. Without the
language marker, an over long Indonesian summary would fail the save with nothing
on screen to explain it.

## Reused, not rewritten

`AdminField`, `AdminFieldset`, `AdminSelect`, `AdminTextarea`, `AdminCheckbox`,
`AdminFile` from `src/components/admin/AdminField.tsx`; `MarkdownEditor`;
`PendingFileInput` for the picked but not yet uploaded file; `SubmitButton`;
`uploadRejectionReason()` from `src/lib/upload-limits.ts` for the client side
size guard; `FormState` and `initialFormState` from `src/schemas/admin.ts`.

`LandingSectionEditor.tsx` becomes the block editor. Its item level machinery,
indexed names, move up and down, the image field with its hidden URL plus pending
file, and localized pair rendering, is the part worth keeping; what goes is the
fixed eight slot table that drives it.
