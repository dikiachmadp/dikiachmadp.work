"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import { pageQuery } from "@/lib/pagination";
import {
  formValues,
  testimonialFormSchema,
  testimonialInputFromForm,
  toFieldErrors,
  type FormState,
} from "@/schemas/admin";
import {
  createTestimonial,
  deleteTestimonialById,
  updateTestimonial,
} from "@/lib/db/testimonials";

function revalidateHome() {
  revalidatePath("/en");
  revalidatePath("/id");
}

function parse(formData: FormData) {
  const parsed = testimonialFormSchema.safeParse(
    testimonialInputFromForm(formData),
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

export async function createTestimonialAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = (formData.get("formLocale") as string) || "en";
  await requireUser(locale);

  const result = parse(formData);
  if (!result.ok) return result.state;

  await createTestimonial(result.data);
  revalidateHome();
  redirect(`/${locale}/dashboard/testimonials`);
}

export async function updateTestimonialAction(
  id: string,
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = (formData.get("formLocale") as string) || "en";
  await requireUser(locale);

  const result = parse(formData);
  if (!result.ok) return result.state;

  await updateTestimonial(id, result.data);
  revalidateHome();
  redirect(`/${locale}/dashboard/testimonials`);
}

export async function deleteTestimonialAction(id: string, formData: FormData) {
  const locale = (formData.get("formLocale") as string) || "en";
  await requireUser(locale);

  await deleteTestimonialById(id);
  revalidateHome();
  // Kembali ke halaman tempat tombolnya ditekan, bukan selalu ke halaman 1.
  redirect(
    `/${locale}/dashboard/testimonials${pageQuery(formData.get("page"))}`,
  );
}
