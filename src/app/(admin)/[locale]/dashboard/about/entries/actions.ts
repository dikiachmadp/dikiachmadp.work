"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { pageQuery } from "@/lib/pagination";
import {
  aboutEntryFormSchema,
  aboutEntryInputFromForm,
  formValues,
  toFieldErrors,
  type FormState,
} from "@/schemas/admin";
import {
  createAboutEntry,
  deleteAboutEntryById,
  updateAboutEntry,
} from "@/lib/db/about";
import { revalidateAboutPaths } from "@/lib/db/revalidate";

/** Lihat catatan yang sama di dashboard/about/actions.ts. */
function formLocale(formData: FormData): "en" | "id" {
  return formData.get("formLocale") === "id" ? "id" : "en";
}

function parse(formData: FormData) {
  const parsed = aboutEntryFormSchema.safeParse(
    aboutEntryInputFromForm(formData),
  );
  if (parsed.success) {
    return { ok: true as const, data: parsed.data };
  }
  return {
    ok: false as const,
    state: {
      status: "error",
      message: "Periksa kembali isian yang ditandai.",
      fieldErrors: toFieldErrors(parsed.error),
      values: formValues(formData),
    } satisfies FormState,
  };
}

export async function createAboutEntryAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = formLocale(formData);
  await requireUser(locale);

  const result = parse(formData);
  if (!result.ok) return result.state;

  await createAboutEntry(result.data);
  revalidateAboutPaths();
  redirect(`/${locale}/dashboard/about/entries`);
}

export async function updateAboutEntryAction(
  id: string,
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = formLocale(formData);
  await requireUser(locale);

  const result = parse(formData);
  if (!result.ok) return result.state;

  await updateAboutEntry(id, result.data);
  revalidateAboutPaths();
  redirect(`/${locale}/dashboard/about/entries`);
}

export async function deleteAboutEntryAction(id: string, formData: FormData) {
  const locale = formLocale(formData);
  await requireUser(locale);

  await deleteAboutEntryById(id);
  revalidateAboutPaths();
  redirect(
    `/${locale}/dashboard/about/entries${pageQuery(formData.get("page"))}`,
  );
}
