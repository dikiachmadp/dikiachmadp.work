"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  AdminField,
  AdminFieldset,
  AdminSelect,
  AdminTextarea,
} from "./AdminField";
import SubmitButton from "./SubmitButton";
import { initialFormState, type FormState } from "@/schemas/admin";

export interface TestimonialFormValues {
  locale: string;
  name: string;
  role: string;
  content: string;
  avatarUrl: string;
  projectRef: string;
  order: string;
}

export const emptyTestimonialForm: TestimonialFormValues = {
  locale: "en",
  name: "",
  role: "",
  content: "",
  avatarUrl: "",
  projectRef: "",
  order: "0",
};

export default function TestimonialForm({
  action,
  locale,
  values,
  projectSlugs,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  locale: string;
  values: TestimonialFormValues;
  projectSlugs: string[];
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

      <AdminFieldset legend="Testimonial">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <AdminSelect
            name="locale"
            label="Language"
            required
            options={["en", "id"]}
            defaultValue={v("locale", values.locale)}
            error={err("locale")}
          />
          <AdminField
            name="name"
            label="Client name"
            required
            defaultValue={v("name", values.name)}
            error={err("name")}
          />
          <AdminField
            name="role"
            label="Role"
            required
            placeholder="Client from Australia"
            defaultValue={v("role", values.role)}
            error={err("role")}
          />
        </div>

        <AdminTextarea
          name="content"
          label="Quote"
          required
          rows={4}
          defaultValue={v("content", values.content)}
          error={err("content")}
        />

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <AdminSelect
            name="projectRef"
            label="Related project"
            options={["", ...projectSlugs]}
            defaultValue={v("projectRef", values.projectRef)}
            error={err("projectRef")}
          />
          <AdminField
            name="avatarUrl"
            label="Avatar URL"
            defaultValue={v("avatarUrl", values.avatarUrl)}
            error={err("avatarUrl")}
          />
          <AdminField
            name="order"
            label="Order"
            hint="Lower shows first."
            defaultValue={v("order", values.order)}
            error={err("order")}
          />
        </div>
      </AdminFieldset>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link
          href={`/${locale}/dashboard/testimonials`}
          className="r-tag ink-border lift-chip px-4 py-2.5 text-[12px] font-bold"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
