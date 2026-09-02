# Locale copy

## Overview

Per language UI copy: page headers, section titles, button labels, accessible
names, policy text, and the project category list. One folder per locale
(`en`, `id`) holding the same 14 JSON files. Everything here is loaded, Zod
validated, and returned as one object by `getDictionary()` in
`@/lib/dictionary`.

## Key files

| File                     | Owns                                               |
| ------------------------ | -------------------------------------------------- |
| `{en,id}/*.json`         | The copy itself, identical key set in both folders |
| `src/schemas/content.ts` | The Zod schema each file is parsed against         |
| `src/lib/dictionary.ts`  | The loader map and the `FullDictionary` assembly   |
| `src/types/content.ts`   | Types inferred from the schemas                    |

## Conventions

- **This is copy, not content.** The database is the source of truth for
  projects, products, testimonials, logbook posts, and about entries. Those are
  edited through the dashboard and never live here.
- Adding a key means editing four places: `en/<file>.json`, `id/<file>.json`,
  the schema in `src/schemas/content.ts`, and, for a new file, the loader map
  plus the assembly in `src/lib/dictionary.ts`.
- Placeholders use `{name}` and are filled by `fill()` in `@/lib/utils`. Whole
  sentences live in the JSON rather than being concatenated in a component,
  because the word order differs between the two languages.
- Category values are keys, not labels. The key is stored on the database row;
  the label is looked up per locale at render time.

## Gotchas

- **A missing or misshapen key throws at import.** `getDictionary()` parses
  every file and rethrows as "Failed to validate dictionary data", so a typo in
  one JSON file takes down every page for that locale, not just one section.
- Any array read by index (for example `ui.admin.nav`) must keep the same order
  in both locale files. Inserting an item in the middle of one silently shifts
  the other.
- `fill()` leaves an unknown placeholder in place rather than blanking it. A
  visible `{oops}` in an alt attribute is a bug you can find; an empty string is
  not.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
