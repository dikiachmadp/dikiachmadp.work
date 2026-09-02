# Admin route group

## Overview

The dashboard where all database backed content is edited: projects, digital
products, about content, logbook posts, testimonials, orders, and contact
submissions. It is a Next.js route group, so `(admin)` never appears in a URL;
the real paths are `/{locale}/dashboard/...`, `/{locale}/login`, and the
password recovery pages.

## Key files

| File                              | Owns                                                             |
| --------------------------------- | ---------------------------------------------------------------- |
| `[locale]/dashboard/layout.tsx`   | Calls `requireUser()` for the whole subtree, builds the nav      |
| `[locale]/dashboard/*/actions.ts` | Server actions: validate, upload, mutate, revalidate, redirect   |
| `[locale]/login/actions.ts`       | Sign in, and the allowlist check that refuses to issue a session |
| `[locale]/auth/callback/`         | Supabase auth code exchange                                      |
| `src/components/admin/`           | The forms these pages render                                     |

## Conventions

- **Every server action calls `requireUser()` first.** The layout gate is not
  enough: an action can be invoked without the layout ever rendering.
- Forms use the `FormState` shape from `@/schemas/admin`
  (`status`, `message`, `fieldErrors`, `values`). Returning `values` is what
  keeps the inputs filled after a failed validation, because React resets the
  form once the action settles.
- **Validate before you upload.** Parse the form with Zod first, then send
  files to Storage. The other order leaves orphan objects behind whenever
  validation fails. `parseAndUpload()` in `dashboard/projects/actions.ts` is
  the reference implementation.
- After every mutation, call the matching helper in `@/lib/db/revalidate`, then
  `redirect()` back to the list with `pageQuery(...)` so the admin lands on the
  page they came from.
- User facing strings in the dashboard come from `ui.admin` in the per locale
  `ui.json`, not from literals in the component.

## Gotchas

- **Authorization is checked in three places on purpose**, all reading
  `src/lib/admin-allowlist.ts`: `src/proxy.ts` (the middleware guard),
  `requireUser()` in `src/lib/supabase/auth.ts`, and `login/actions.ts`. A
  valid Supabase session proves identity, never authority: the anon key ships
  in the browser bundle, so anyone who manages to sign up holds a real session.
  Do not collapse these into one check.
- An empty or missing `ADMIN_EMAILS` fails closed in all three.
- `requireUser()` signs the user out before redirecting a non admin. Rejecting
  without clearing the session would leave a valid cookie in play.
- `admin.nav` in `ui.json` is an indexed array. Inserting an item in the middle
  shifts every index after it, and the order in `dashboard/layout.tsx` must
  match both `ui.json` files exactly.
- `src/proxy.ts` carries a second matcher entry for the dashboard subtree. The
  main matcher skips any path containing a dot, so `/en/dashboard/a.b` would
  otherwise slip past the guard.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
