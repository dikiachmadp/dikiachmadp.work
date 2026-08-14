"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  AdminCheckbox,
  AdminField,
  AdminFieldset,
  AdminFile,
  AdminSelect,
  AdminTextarea,
} from "./AdminField";
import SubmitButton from "./SubmitButton";
import { slugifyCategory } from "@/lib/slugify";
import { uploadRejectionReason } from "@/lib/upload-limits";
import { initialFormState, type FormState } from "@/schemas/admin";

export interface ProjectFormValues {
  slug: string;
  categoryKey: string;
  year: string;
  date: string;
  coverImage: string;
  logoUrl: string;
  accent: string;
  featured: boolean;
  liveUrl: string;
  isLivePreview: boolean;
  tags: string;
  tools: string;
  gallery: string;
  translations: Record<
    "en" | "id",
    {
      title: string;
      category: string;
      client: string;
      description: string;
      role: string;
      duration: string;
      contentBlocks: string;
    }
  >;
}

export const emptyProjectForm: ProjectFormValues = {
  slug: "",
  categoryKey: "",
  year: String(new Date().getFullYear()),
  date: new Date().toISOString().slice(0, 10),
  coverImage: "",
  logoUrl: "",
  accent: "",
  featured: false,
  liveUrl: "",
  isLivePreview: false,
  tags: "",
  tools: "",
  gallery: "",
  translations: {
    en: {
      title: "",
      category: "",
      client: "",
      description: "",
      role: "",
      duration: "",
      contentBlocks: "",
    },
    id: {
      title: "",
      category: "",
      client: "",
      description: "",
      role: "",
      duration: "",
      contentBlocks: "",
    },
  },
};

export default function ProjectForm({
  action,
  locale,
  values,
  categories,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  locale: string;
  values: ProjectFormValues;
  /** Label kategori per locale, diambil dari src/content/{en,id}/projects.json. */
  categories: Record<"en" | "id", string[]>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialFormState);
  const [categoryEn, setCategoryEn] = useState(
    values.translations.en.category || categories.en[0],
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  /**
   * Next menolak body yang melebihi `serverActions.bodySizeLimit` sebelum
   * server action sempat jalan, jadi tidak ada jalur untuk mengembalikan pesan
   * yang bisa dibaca — admin hanya melihat kiriman yang gagal begitu saja.
   * Satu submit bisa membawa cover + logo + banyak gambar galeri, jadi total
   * mudah melewati batas walau tiap berkasnya sah. Diperiksa di sini dulu.
   */
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

  // Nilai yang dikirim sebelumnya menang, supaya isian tidak hilang saat
  // validasi gagal — React me-reset form setelah server action selesai.
  const v = (name: string, fallback: string) =>
    state.values?.[name] ?? fallback;
  const err = (name: string) => state.fieldErrors?.[name];

  return (
    <form
      action={formAction}
      onSubmit={guardUploadSize}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="formLocale" value={locale} />
      {/* Diturunkan dari label EN supaya filter publik tidak pernah putus. */}
      <input
        type="hidden"
        name="categoryKey"
        value={slugifyCategory(categoryEn)}
      />

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

      <AdminFieldset legend="Basics">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <AdminField
            name="slug"
            label="Slug"
            required
            hint="Lowercase, digits and hyphens — used in the URL."
            placeholder="my-project"
            defaultValue={v("slug", values.slug)}
            error={err("slug")}
          />
          <AdminSelect
            name="translations.en.category"
            label="Category (EN)"
            required
            options={categories.en}
            value={categoryEn}
            onChange={setCategoryEn}
            error={err("translations.en.category")}
          />
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <AdminField
            name="year"
            label="Year"
            required
            placeholder="2026"
            defaultValue={v("year", values.year)}
            error={err("year")}
          />
          <AdminField
            name="date"
            label="Date"
            type="date"
            required
            defaultValue={v("date", values.date)}
            error={err("date")}
          />
          <AdminSelect
            name="translations.id.category"
            label="Category (ID)"
            required
            options={categories.id}
            defaultValue={v(
              "translations.id.category",
              values.translations.id.category || categories.id[0],
            )}
            error={err("translations.id.category")}
          />
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <AdminField
            name="tags"
            label="Tags"
            hint="Comma separated."
            placeholder="Branding, Print"
            defaultValue={v("tags", values.tags)}
            error={err("tags")}
          />
          <AdminField
            name="tools"
            label="Tools"
            hint="Comma separated."
            placeholder="Figma, Illustrator"
            defaultValue={v("tools", values.tools)}
            error={err("tools")}
          />
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <AdminField
            name="liveUrl"
            label="Live URL"
            placeholder="https://…"
            defaultValue={v("liveUrl", values.liveUrl)}
            error={err("liveUrl")}
          />
          <div className="flex items-end gap-3.5">
            <AdminCheckbox
              name="featured"
              label="Featured"
              defaultChecked={values.featured}
            />
            <AdminCheckbox
              name="isLivePreview"
              label="Live preview"
              defaultChecked={values.isLivePreview}
            />
          </div>
        </div>
      </AdminFieldset>

      <AdminFieldset legend="Images">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <AdminField
            name="coverImage"
            label="Cover image URL"
            hint="Leave empty and upload below, or keep empty for the crosshatch panel."
            defaultValue={v("coverImage", values.coverImage)}
            error={err("coverImage")}
          />
          <AdminFile name="coverImageFile" label="Upload cover" />
          <AdminField
            name="logoUrl"
            label="Logo URL"
            defaultValue={v("logoUrl", values.logoUrl)}
            error={err("logoUrl")}
          />
          <AdminFile name="logoFile" label="Upload logo" />
        </div>
        <AdminTextarea
          name="gallery"
          label="Gallery URLs"
          rows={3}
          hint="One URL per line. Uploads below are appended."
          defaultValue={v("gallery", values.gallery)}
          error={err("gallery")}
        />
        <AdminFile name="galleryFiles" label="Upload gallery images" multiple />
      </AdminFieldset>

      {(["en", "id"] as const).map((lang) => (
        <AdminFieldset
          key={lang}
          legend={lang === "en" ? "English" : "Bahasa Indonesia"}
        >
          <AdminField
            name={`translations.${lang}.title`}
            label="Title"
            required
            defaultValue={v(
              `translations.${lang}.title`,
              values.translations[lang].title,
            )}
            error={err(`translations.${lang}.title`)}
          />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <AdminField
              name={`translations.${lang}.client`}
              label="Client"
              required
              defaultValue={v(
                `translations.${lang}.client`,
                values.translations[lang].client,
              )}
              error={err(`translations.${lang}.client`)}
            />
            <AdminField
              name={`translations.${lang}.role`}
              label="Role"
              defaultValue={v(
                `translations.${lang}.role`,
                values.translations[lang].role,
              )}
              error={err(`translations.${lang}.role`)}
            />
            <AdminField
              name={`translations.${lang}.duration`}
              label="Duration"
              defaultValue={v(
                `translations.${lang}.duration`,
                values.translations[lang].duration,
              )}
              error={err(`translations.${lang}.duration`)}
            />
          </div>
          <AdminTextarea
            name={`translations.${lang}.description`}
            label="Description"
            required
            rows={3}
            defaultValue={v(
              `translations.${lang}.description`,
              values.translations[lang].description,
            )}
            error={err(`translations.${lang}.description`)}
          />
          <AdminTextarea
            name={`translations.${lang}.contentBlocks`}
            label="Body"
            rows={6}
            hint="Separate paragraphs with a blank line."
            defaultValue={v(
              `translations.${lang}.contentBlocks`,
              values.translations[lang].contentBlocks,
            )}
            error={err(`translations.${lang}.contentBlocks`)}
          />
        </AdminFieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link
          href={`/${locale}/dashboard/projects`}
          className="r-tag ink-border lift-chip px-4 py-2.5 text-[12px] font-bold"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
