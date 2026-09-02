# Components

## Overview

All UI for the site: reusable primitives (`ui/`), page sections (`sections/`),
chrome (`layout/`), client side widgets (`interactive/`), the product landing
builder (`product/`), the admin forms (`admin/`), logbook rendering
(`logbook/`), the printable receipt (`documents/`), and JSON-LD (`seo/`).
The look is a hand drawn ink on paper theme driven entirely by CSS custom
properties defined in `src/app/globals.css`.

## Key files

| File                         | Owns                                                                |
| ---------------------------- | ------------------------------------------------------------------- |
| `src/app/globals.css`        | Theme tokens, base styles, keyframes                                |
| `layout/ThemeProvider.tsx`   | `next-themes` wiring, writes `data-theme` on `<html>`               |
| `ui/`                        | Button, Chip, Tag, Gallery, Pagination, cards, and other primitives |
| `product/ProductLanding.tsx` | Renders the landing sections an admin configured                    |
| `admin/`                     | Dashboard forms, driven by the `FormState` contract                 |

## Conventions

- Compose class names with `cn()` from `@/lib/utils` (clsx plus tailwind-merge),
  never by string concatenation, so a caller can override a default class.
- Colour comes from tokens only: `--paper`, `--ink`, `--soft`, `--line`,
  `--wash`, `--dot`, `--accent`, `--accent-ink`. Dark mode is the exact inverse
  of light, so **no component should carry a per mode override.**
- Fonts are tokens too: `--font-hand` (headings), `--font-note`, `--font-body`,
  `--font-tech`. They are injected by `next/font` in `[locale]/layout.tsx`.
- Server components by default. Add `"use client"` only where state, effects,
  or event handlers are genuinely needed; roughly 36 of the 76 components do.
- Text comes in as props from the dictionary. A component does not import copy
  itself, and it never hardcodes a user facing string.
- Component tests live beside the component (`Gallery.tsx`, `Gallery.test.tsx`).
- Prettier sorts Tailwind classes via `prettier-plugin-tailwindcss`, configured
  against `./src/app/globals.css`. Do not hand order class lists.

## Gotchas

- **`--accent` and `--accent-ink` are two roles, not a duplicate.** `--accent`
  is a surface, always paired with white text, and it holds the same value in
  both modes because lightening it would break every one of those pairings.
  `--accent-ink` is the foreground role (accent text, icons, borders) and dark
  mode gets a lighter teal so it clears AA contrast on the dark paper. Do not
  collapse them.
- `:root` deliberately sets no `color-scheme`. `next-themes` writes it inline on
  `<html>`, and an inline style beats any stylesheet rule, so a declaration in
  `globals.css` would never apply.
- `--nav-h` exists because the navbar height and the mobile sheet's top offset
  have to agree. They used to be two hardcoded values in two files, and changing
  one alone left a gap or covered the bar.
- **The CSP is enforced, not report only.** A component that loads a script,
  font, image, or media file from a new origin is a broken feature, not a
  console warning. Walk the routes with the console open after such a change,
  and read the response headers section of `docs/operations.md` first.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
