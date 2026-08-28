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
import LandingSectionEditor, {
  emptyLandingState,
  landingStateFromValue,
  type LandingState,
} from "./LandingSectionEditor";
import MarkdownEditor from "./MarkdownEditor";
import SubmitButton from "./SubmitButton";
import { uploadRejectionReason } from "@/lib/upload-limits";
import { initialFormState, type FormState } from "@/schemas/admin";
import { LANDING_SLOTS, type ProductLanding } from "@/schemas/product-landing";

const LANGS = [
  { code: "en", legend: "English" },
  { code: "id", legend: "Bahasa Indonesia" },
] as const;

type Lang = (typeof LANGS)[number]["code"];

export interface ProductTranslationValues {
  slug: string;
  title: string;
  summary: string;
  body: string;
}

export interface ProductFormValues {
  status: "DRAFT" | "PUBLISHED";
  /** Format `datetime-local`: "2026-08-15T09:30", atau kosong. */
  publishedAt: string;
  featured: boolean;
  order: string;
  price: string;
  currency: string;
  buyUrl: string;
  polarProductId: string;
  pwywEnabled: boolean;
  /** Sen, sebagai string karena berasal dari input form. */
  pwywMinAmount: string;
  coverImage: string;
  gallery: string;
  tags: string;
  /** Seksi halaman jualan apa adanya dari database. */
  landing: ProductLanding;
  translations: Record<Lang, ProductTranslationValues>;
}

const emptyTranslation: ProductTranslationValues = {
  slug: "",
  title: "",
  summary: "",
  body: "",
};

export const emptyProductForm: ProductFormValues = {
  status: "DRAFT",
  publishedAt: "",
  featured: false,
  order: "0",
  price: "",
  currency: "USD",
  buyUrl: "",
  polarProductId: "",
  pwywEnabled: false,
  pwywMinAmount: "0",
  coverImage: "",
  gallery: "",
  tags: "",
  landing: {},
  translations: { en: { ...emptyTranslation }, id: { ...emptyTranslation } },
};

const STATUS_OPTIONS = ["DRAFT", "PUBLISHED"];

export default function ProductForm({
  action,
  locale,
  values,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  locale: string;
  values: ProductFormValues;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialFormState);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Seksi disimpan di state, bukan sebagai input tak terkendali: berkas gambar
  // yang belum diunggah tidak bisa hidup di DOM, dan React me-reset form
  // setiap kali server action selesai.
  const [landing, setLanding] = useState<LandingState>(() =>
    values.landing
      ? landingStateFromValue(values.landing)
      : emptyLandingState(),
  );

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
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <AdminField
            name="order"
            label="Order"
            hint="Lower shows first in the catalog."
            defaultValue={v("order", values.order)}
            error={err("order")}
          />
          <AdminField
            name="tags"
            label="Tags"
            hint="Comma separated."
            placeholder="OJS, Template"
            defaultValue={v("tags", values.tags)}
            error={err("tags")}
          />
          <div className="flex items-end">
            <AdminCheckbox
              name="featured"
              label="Featured"
              defaultChecked={values.featured}
            />
          </div>
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

      <AdminFieldset legend="Pricing & purchase">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <AdminField
            name="price"
            label="Price"
            hint='Leave empty for "not set" — 0 means genuinely free.'
            placeholder="19.99"
            defaultValue={v("price", values.price)}
            error={err("price")}
          />
          <AdminField
            name="currency"
            label="Currency"
            required
            placeholder="USD"
            defaultValue={v("currency", values.currency)}
            error={err("currency")}
          />
          <AdminField
            name="buyUrl"
            label="External store URL"
            hint="Only for products sold elsewhere. Leave empty when Polar handles it."
            placeholder="https://gumroad.com/l/…"
            defaultValue={v("buyUrl", values.buyUrl)}
            error={err("buyUrl")}
          />
        </div>
      </AdminFieldset>

      <AdminFieldset legend="On-site checkout (Polar)">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <AdminField
            name="polarProductId"
            label="Polar product ID"
            hint="Fill this in and the buy button opens checkout on the page itself."
            defaultValue={v("polarProductId", values.polarProductId)}
            error={err("polarProductId")}
          />
          <AdminField
            name="pwywMinAmount"
            label="Minimum amount (cents)"
            type="number"
            hint="0 lets people take it for free. Polar still has the final say."
            defaultValue={v("pwywMinAmount", values.pwywMinAmount)}
            error={err("pwywMinAmount")}
          />
        </div>
        <AdminCheckbox
          name="pwywEnabled"
          label="Pay what you want"
          defaultChecked={values.pwywEnabled}
        />
      </AdminFieldset>

      <AdminFieldset legend="Images">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <AdminField
            name="coverImage"
            label="Cover image URL"
            required
            hint="Leave empty and upload below, or keep empty for the crosshatch panel."
            defaultValue={v("coverImage", values.coverImage)}
            error={err("coverImage")}
          />
          <AdminFile name="coverImageFile" label="Upload cover" />
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

      {LANDING_SLOTS.map((spec) => (
        <AdminFieldset key={spec.slot} legend={spec.legend}>
          <LandingSectionEditor
            spec={spec}
            section={landing[spec.slot]}
            onChange={(section) =>
              setLanding((current) => ({ ...current, [spec.slot]: section }))
            }
            fieldErrors={state.fieldErrors}
          />
        </AdminFieldset>
      ))}

      {LANGS.map(({ code, legend }) => (
        <AdminFieldset key={code} legend={legend}>
          <p className="m-0 text-[11px] text-(--soft)">
            Leave every field here empty to skip this language — the product
            then does not exist on the {legend} side of the site.
          </p>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <AdminField
              name={`translations.${code}.slug`}
              label="Slug"
              hint="Lowercase, digits and hyphens. Slugs are per language."
              placeholder="a-product-name"
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
            name={`translations.${code}.summary`}
            label="Summary"
            hint="Shown on the index cards and used as the meta description."
            defaultValue={v(
              `translations.${code}.summary`,
              values.translations[code].summary,
            )}
            error={err(`translations.${code}.summary`)}
          />

          <MarkdownEditor
            name={`translations.${code}.body`}
            label="Body"
            context={legend}
            defaultValue={values.translations[code].body}
            error={err(`translations.${code}.body`)}
          />
        </AdminFieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link
          href={`/${locale}/dashboard/products`}
          className="r-tag ink-border lift-chip px-4 py-2.5 text-[12px] font-bold"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
