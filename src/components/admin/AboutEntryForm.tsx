"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AdminField, AdminFieldset, AdminSelect } from "./AdminField";
import SubmitButton from "./SubmitButton";
import { initialFormState, type FormState } from "@/schemas/admin";

export interface AboutEntryFormValues {
  kind: string;
  locale: string;
  order: string;
  year: string;
  title: string;
  subtitle: string;
  url: string;
}

export const emptyAboutEntryForm: AboutEntryFormValues = {
  kind: "EXPERIENCE",
  locale: "en",
  order: "0",
  year: "",
  title: "",
  subtitle: "",
  url: "",
};

export default function AboutEntryForm({
  action,
  locale,
  values,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  locale: string;
  values: AboutEntryFormValues;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialFormState);
  const v = (name: string, fallback: string) =>
    state.values?.[name] ?? fallback;
  const err = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="formLocale" value={locale} />

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="ink-border-dashed r-chip m-0 bg-(--wash) px-4 py-3 text-[13px] font-semibold"
        >
          {state.message}
        </p>
      )}

      <AdminFieldset legend="Entry">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <AdminSelect
            name="kind"
            label="Kind"
            required
            options={[
              { value: "EXPERIENCE", label: "Experience" },
              { value: "CERTIFICATION", label: "Certification" },
            ]}
            defaultValue={v("kind", values.kind)}
            error={err("kind")}
          />
          <AdminSelect
            name="locale"
            label="Language"
            required
            options={["en", "id"]}
            defaultValue={v("locale", values.locale)}
            error={err("locale")}
          />
          <AdminField
            name="order"
            label="Order"
            hint="Lower shows first."
            defaultValue={v("order", values.order)}
            error={err("order")}
          />
        </div>

        <AdminField
          name="year"
          label="Year"
          required
          placeholder="2016 — now"
          defaultValue={v("year", values.year)}
          error={err("year")}
        />

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <AdminField
            name="title"
            label="Title"
            required
            hint="Role for Experience, certification name for Certification."
            defaultValue={v("title", values.title)}
            error={err("title")}
          />
          <AdminField
            name="subtitle"
            label="Subtitle"
            required
            hint="Workplace for Experience, issuer for Certification."
            defaultValue={v("subtitle", values.subtitle)}
            error={err("subtitle")}
          />
        </div>

        <AdminField
          name="url"
          label="Verification URL"
          hint="Certification only — leave empty for Experience."
          placeholder="https://…"
          defaultValue={v("url", values.url)}
          error={err("url")}
        />
      </AdminFieldset>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link
          href={`/${locale}/dashboard/about/entries`}
          className="r-tag ink-border lift-chip px-4 py-2.5 text-[12px] font-bold"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
