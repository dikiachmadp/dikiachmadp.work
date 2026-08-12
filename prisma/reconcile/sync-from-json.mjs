/**
 * One-off reconciliation, written 2026-08-12.
 *
 * The public pages used to read src/content/{en,id}/*.json while the database
 * held an older copy of the same content (the redesign rewrote every project
 * description, added role/duration, and deliberately blanked the covers of the
 * nine non-web projects). Before the pages switch to the DAL, push the JSON —
 * which is what the live site actually shows — into the database, so the switch
 * is a visual no-op.
 *
 * Deliberately NOT synced:
 *   - tools:   richer in the DB and not rendered by any component today.
 *   - gallery: the two files referenced for website-ekonomi are missing from
 *              public/, so the references are cleared instead (re-upload via
 *              the admin CMS once it ships).
 *   - the two extra testimonials that exist only in the DB: real client quotes
 *              that were never published, kept on purpose.
 *
 * Idempotent: re-running writes the same values. Reads DATABASE_URL from .env.
 *
 *   node prisma/reconcile/sync-from-json.mjs [--dry]
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pg = require("pg");

const DRY = process.argv.includes("--dry");
const LOCALES = ["en", "id"];
const root = new URL("../../", import.meta.url).pathname;

const url = readFileSync(root + ".env", "utf8").match(
  /^DATABASE_URL="?([^"\n]+)"?/m,
)?.[1];
if (!url) throw new Error("DATABASE_URL tidak ditemukan di .env");

const readJson = (p) => JSON.parse(readFileSync(root + p, "utf8"));

const client = new pg.Client({ connectionString: url });
await client.connect();

let projectUpdates = 0;
let translationUpdates = 0;
let testimonialUpdates = 0;

const run = async (sql, params) => {
  if (DRY) return { rowCount: 0 };
  return client.query(sql, params);
};

// --- Projects -------------------------------------------------------------
// Locale-invariant columns come from the EN file (both files agree on them).
const enItems = readJson("src/content/en/projects.json").items;

for (const item of enItems) {
  const res = await run(
    `update "Project" set
       year = $2, date = $3, "coverImage" = $4, "logoUrl" = $5,
       featured = $6, tags = $7, "liveUrl" = $8, "isLivePreview" = $9,
       gallery = $10, "updatedAt" = now()
     where slug = $1`,
    [
      item.slug,
      item.year,
      item.date,
      item.coverImage ?? "",
      item.logoUrl || null,
      item.featured ?? false,
      item.tags ?? [],
      item.liveUrl || null,
      item.isLivePreview ?? false,
      [], // gallery: see header note
    ],
  );
  projectUpdates += res.rowCount ?? 0;
}

// --- Translations ---------------------------------------------------------
for (const locale of LOCALES) {
  for (const item of readJson(`src/content/${locale}/projects.json`).items) {
    const res = await run(
      `update "ProjectTranslation" t set
         title = $3, category = $4, client = $5, description = $6,
         role = $7, duration = $8, "contentBlocks" = $9::jsonb
       from "Project" p
       where t."projectId" = p.id and p.slug = $1 and t.locale = $2`,
      [
        item.slug,
        locale,
        item.title,
        item.category,
        item.client,
        item.description,
        item.role || null,
        item.duration || null,
        item.contentBlocks ? JSON.stringify(item.contentBlocks) : null,
      ],
    );
    translationUpdates += res.rowCount ?? 0;
  }
}

// --- Testimonials ---------------------------------------------------------
// Align the wording of the four that are already published; the two DB-only
// quotes keep their own text and stay.
for (const locale of LOCALES) {
  for (const t of readJson(`src/content/${locale}/testimonials.json`).items) {
    const res = await run(
      `update "Testimonial" set name = $3, role = $4, content = $5
       where locale = $1 and "projectRef" = $2`,
      [locale, t.projectRef, t.clientName, t.role, t.content],
    );
    testimonialUpdates += res.rowCount ?? 0;
  }
}

console.log(
  DRY
    ? "dry run — tidak ada yang ditulis"
    : `Project: ${projectUpdates} baris, ProjectTranslation: ${translationUpdates} baris, Testimonial: ${testimonialUpdates} baris`,
);

await client.end();
