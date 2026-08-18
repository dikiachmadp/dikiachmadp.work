# dikiachmadp.work

Personal portfolio website for **Diki Achmad Prasetya** — Freelancer based in Bandung,
Indonesia.

**Live site:** [dikiachmadp.work](https://dikiachmadp.work)

![Preview](public/ogImage.webp)

[![CI](https://github.com/dikiachmadp/dikiachmadp.work/actions/workflows/ci.yml/badge.svg)](https://github.com/dikiachmadp/dikiachmadp.work/actions/workflows/ci.yml)

## Features

- Bilingual portfolio (English / Indonesian) with locale-aware routing
- Logbook (blog) with independent slugs per language
- Admin dashboard for managing projects, logbook posts, testimonials, and
  contact submissions
- Contact form with rate limiting
- PWA manifest and JSON-LD structured data for search and AI assistants

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + [React 19](https://react.dev)
- TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Prisma 7](https://www.prisma.io) + Supabase Postgres
- Supabase Auth
- [Resend](https://resend.com) for transactional email
- [Upstash Redis](https://upstash.com) for rate limiting
- Deployed on [Vercel](https://vercel.com)

## Getting started

```bash
git clone https://github.com/dikiachmadp/dikiachmadp.work.git
cd dikiachmadp.work
npm install
cp .env.example .env
```

Fill in `.env` — see [`.env.example`](.env.example) for the full list of
required variables and where each one is used.

```bash
npm run dev
```

## Project structure

```
src/
├── app/
│   ├── [locale]/     # Public, locale-aware pages (about, projects, logbook, …)
│   └── (admin)/       # Admin dashboard route group
├── components/        # UI, layout, section, and admin components
├── content/{en,id}/    # Per-locale UI copy (page headers, labels, categories)
├── lib/                # Data access, auth, metadata, and other server utilities
└── schemas/            # Zod schemas for content and forms
```

## Scripts

| Script               | Description                           |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Start the dev server                  |
| `npm run build`      | Generate the Prisma client and build  |
| `npm run start`      | Start the production server           |
| `npm run lint`       | Run ESLint                            |
| `npm run typecheck`  | Run the TypeScript compiler (no emit) |
| `npm test`           | Run the test suite (Vitest)           |
| `npm run format`     | Format the codebase with Prettier     |
| `npm run db:migrate` | Apply pending Prisma migrations       |

## Deployment & operations

The site deploys to Vercel on every push to `main`. Database migrations,
Supabase configuration, storage policies, and security hardening notes are
documented in [`docs/operations.md`](docs/operations.md).

> **Never run `prisma db push`, `prisma migrate dev`, or `prisma migrate
reset` against production.** Use `npm run db:migrate`
> (`prisma migrate deploy`) for schema changes.

## License

All rights reserved. Contact [dikiachmadp123@gmail.com](mailto:dikiachmadp123@gmail.com)
for inquiries.
