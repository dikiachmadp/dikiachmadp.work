"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AdminField, AdminFieldset, AdminSelect } from "./AdminField";
import GalleryEditor, {
  entriesFromImages,
  type GalleryEntry,
} from "./GalleryEditor";
import MarkdownEditor from "./MarkdownEditor";
import SubmitButton from "./SubmitButton";
import { uploadRejectionReason } from "@/lib/upload-limits";
import { initialFormState, type FormState } from "@/schemas/admin";

const LANGS = [
  { code: "en", legend: "English" },
  { code: "id", legend: "Bahasa Indonesia" },
] as const;

type Lang = (typeof LANGS)[number]["code"];

export interface LogbookTranslationValues {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  images: { url: string; alt: string; caption?: string }[];
}

export interface LogbookFormValues {
  status: "DRAFT" | "PUBLISHED";
  /** Format `datetime-local`: "2026-08-15T09:30", atau kosong. */
  publishedAt: string;
  translations: Record<Lang, LogbookTranslationValues>;
}

const emptyTranslation: LogbookTranslationValues = {
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  images: [],
};

export const emptyLogbookForm: LogbookFormValues = {
  status: "DRAFT",
  publishedAt: "",
  translations: { en: { ...emptyTranslation }, id: { ...emptyTranslation } },
};

const STATUS_OPTIONS = ["DRAFT", "PUBLISHED"];

export default function LogbookForm({
  action,
  locale,
  values,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  locale: string;
  values: LogbookFormValues;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialFormState);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Galeri hidup di state komponen, bukan di input tak terkendali: React
  // me-reset form setelah server action, dan `state.values` hanya membawa
  // string — daftar berkas tertunda tidak akan selamat lewat sana.
  const [galleries, setGalleries] = useState<Record<Lang, GalleryEntry[]>>({
    en: entriesFromImages(values.translations.en.images),
    id: entriesFromImages(values.translations.id.images),
  });

  // Sama seperti ProjectForm: body yang melewati `serverActions.bodySizeLimit`
  // ditolak Next sebelum server action jalan, jadi tidak ada jalur untuk
  // mengembalikan pesan yang terbaca. Diperiksa di klien lebih dulu.
  const guardUploadSize = (event: React.FormEvent<HTMLFormElement>) => {
    const files = Array.from(
      event.currentTarget.querySelectorAll<HTMLInputElement>(
        'input[type="file"]',
      ),
    ).flatMap((input) => Array.from(input.files ?? []));

    const reason = uploadRejectionReason(files);
    setUploadError(reason);
    if (reason) event.preventDefault();
  };

  const v = (name: string, fallback: string) =>
    state.values?.[name] ?? fallback;
  const err = (name: string) => state.fieldErrors?.[name];

  const copyGalleryFrom = (target: Lang, source: Lang) => {
    setGalleries((current) => ({
      ...current,
      // Kunci dibuat ulang supaya dua daftar tidak berbagi identitas React.
      // `alt` ikut tersalin sebagai titik awal — tetap harus diterjemahkan.
      [target]: current[source].map((entry) => ({
        ...entry,
        key: crypto.randomUUID(),
      })),
    }));
  };

  return (
    <form
      action={formAction}
      onSubmit={guardUploadSize}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="formLocale" value={locale} />

      {uploadError && (
        <p
          role="alert"
          className="ink-border-dashed r-chip m-0 bg-(--wash) px-4 py-3 text-[13px] font-semibold text-(--accent-ink)"
        >
          {uploadError}
        </p>
      )}

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="ink-border-dashed r-chip m-0 bg-(--wash) px-4 py-3 text-[13px] font-semibold"
        >
          {state.message}
        </p>
      )}

      <AdminFieldset legend="Publishing">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <AdminSelect
            name="status"
            label="Status"
            required
            options={STATUS_OPTIONS}
            defaultValue={v("status", values.status)}
            error={err("status")}
          />
          <AdminField
            name="publishedAt"
            label="Publish date (UTC)"
            type="datetime-local"
            hint="UTC, not local time. Empty publishes now; a future time schedules it."
            defaultValue={v("publishedAt", values.publishedAt)}
            error={err("publishedAt")}
          />
        </div>
        {err("translations") && (
          <p
            role="alert"
            className="m-0 text-[12px] font-bold text-(--accent-ink)"
          >
            {err("translations")}
          </p>
        )}
      </AdminFieldset>

      {LANGS.map(({ code, legend }) => {
        const other = code === "en" ? "id" : "en";
        return (
          <AdminFieldset key={code} legend={legend}>
            <p className="m-0 text-[11px] text-(--soft)">
              Leave every field here empty to skip this language — the post then
              does not exist on the {legend} side of the site.
            </p>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <AdminField
                name={`translations.${code}.slug`}
                label="Slug"
                hint="Lowercase, digits and hyphens. Slugs are per language."
                placeholder="a-post-about-something"
                defaultValue={v(
                  `translations.${code}.slug`,
                  values.translations[code].slug,
                )}
                error={err(`translations.${code}.slug`)}
              />
              <AdminField
                name={`translations.${code}.title`}
                label="Title"
                defaultValue={v(
                  `translations.${code}.title`,
                  values.translations[code].title,
                )}
                error={err(`translations.${code}.title`)}
              />
            </div>

            <AdminField
              name={`translations.${code}.excerpt`}
              label="Excerpt"
              hint="Shown on the index cards and used as the meta description."
              defaultValue={v(
                `translations.${code}.excerpt`,
                values.translations[code].excerpt,
              )}
              error={err(`translations.${code}.excerpt`)}
            />

            <MarkdownEditor
              name={`translations.${code}.body`}
              label="Body"
              context={legend}
              defaultValue={values.translations[code].body}
              error={err(`translations.${code}.body`)}
            />

            <div className="flex flex-col gap-2.5">
              <GalleryEditor
                prefix={`translations.${code}.images`}
                legend={legend}
                entries={galleries[code]}
                onChange={(entries) =>
                  setGalleries((current) => ({ ...current, [code]: entries }))
                }
                fieldErrors={state.fieldErrors}
              />
              {galleries[other].length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => copyGalleryFrom(code, other)}
                    className="r-tag ink-border lift-chip cursor-pointer px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase"
                  >
                    Copy gallery from{" "}
                    {other === "en" ? "English" : "Indonesian"}
                  </button>
                </div>
              )}
            </div>
          </AdminFieldset>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link
          href={`/${locale}/dashboard/logbook`}
          className="r-tag ink-border lift-chip px-4 py-2.5 text-[12px] font-bold"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
