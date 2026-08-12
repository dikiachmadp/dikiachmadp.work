"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { uploadProjectImage } from "@/lib/storage";
import {
  formValues,
  projectFormSchema,
  projectInputFromForm,
  toFieldErrors,
  type FormState,
} from "@/schemas/admin";
import {
  createProjectWithTranslations,
  deleteProjectById,
  updateProjectWithTranslations,
} from "@/lib/db/projects";
import { revalidateProjectPaths } from "@/lib/db/revalidate";

const UPLOAD_PLACEHOLDER = "__upload__";

function fileFrom(formData: FormData, name: string): File | null {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

// Validasi dulu, baru upload — supaya form yang invalid tidak meninggalkan
// file yatim di Storage.
async function parseAndUpload(
  formData: FormData,
): Promise<
  | { ok: true; data: ReturnType<typeof projectFormSchema.parse> }
  | { ok: false; state: FormState }
> {
  const input = projectInputFromForm(formData);

  const coverFile = fileFrom(formData, "coverImageFile");
  const logoFile = fileFrom(formData, "logoFile");
  const galleryFiles = formData
    .getAll("galleryFiles")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (coverFile && !input.coverImage) input.coverImage = UPLOAD_PLACEHOLDER;
  if (logoFile && !input.logoUrl) input.logoUrl = UPLOAD_PLACEHOLDER;

  const parsed = projectFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Periksa kembali isian yang ditandai.",
        fieldErrors: toFieldErrors(parsed.error),
        values: formValues(formData),
      },
    };
  }

  try {
    const data = parsed.data;
    if (coverFile) {
      data.coverImage = await uploadProjectImage(coverFile, data.slug);
    }
    if (logoFile) {
      data.logoUrl = await uploadProjectImage(logoFile, data.slug);
    }
    for (const file of galleryFiles) {
      data.gallery.push(await uploadProjectImage(file, data.slug));
    }
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      state: {
        status: "error",
        message:
          error instanceof Error ? error.message : "Gagal mengunggah gambar.",
        values: formValues(formData),
      },
    };
  }
}

function slugConflictState(formData: FormData): FormState {
  return {
    status: "error",
    message: "Slug sudah dipakai project lain.",
    fieldErrors: { slug: "Slug sudah dipakai" },
    values: formValues(formData),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function createProjectAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = (formData.get("formLocale") as string) || "en";
  await requireUser(locale);

  const result = await parseAndUpload(formData);
  if (!result.ok) return result.state;

  try {
    await createProjectWithTranslations(result.data);
  } catch (error) {
    if (isUniqueViolation(error)) return slugConflictState(formData);
    throw error;
  }

  revalidateProjectPaths(result.data.slug);
  redirect(`/${locale}/dashboard/projects`);
}

export async function updateProjectAction(
  id: string,
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = (formData.get("formLocale") as string) || "en";
  await requireUser(locale);

  const result = await parseAndUpload(formData);
  if (!result.ok) return result.state;

  try {
    await updateProjectWithTranslations(id, result.data);
  } catch (error) {
    if (isUniqueViolation(error)) return slugConflictState(formData);
    throw error;
  }

  revalidateProjectPaths(result.data.slug);
  redirect(`/${locale}/dashboard/projects`);
}

export async function deleteProjectAction(id: string, formData: FormData) {
  const locale = (formData.get("formLocale") as string) || "en";
  await requireUser(locale);

  await deleteProjectById(id);
  revalidateProjectPaths();
  redirect(`/${locale}/dashboard/projects`);
}
