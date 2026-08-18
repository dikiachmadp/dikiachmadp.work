"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { removeImages, uploadImage } from "@/lib/storage";
import {
  aboutProfileFormSchema,
  aboutProfileInputFromForm,
  formValues,
  toFieldErrors,
  type FormState,
} from "@/schemas/admin";
import { upsertAboutProfile, type AboutProfileInput } from "@/lib/db/about";
import { revalidateAboutPaths } from "@/lib/db/revalidate";

const UPLOAD_PLACEHOLDER = "__upload__";

/**
 * `formLocale` adalah field tersembunyi, jadi isinya dikendalikan klien.
 * Diteruskan mentah ke `redirect()`, `/evil.com` menghasilkan
 * `redirect("//evil.com/...")` yang protocol-relative. Dinormalkan di sini,
 * sama seperti `logbook/actions.ts`.
 */
function formLocale(formData: FormData): "en" | "id" {
  return formData.get("formLocale") === "id" ? "id" : "en";
}

function fileFrom(formData: FormData, name: string): File | null {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

/** Validasi dulu, upload belakangan — sama seperti logbook/actions.ts. */
async function parseAndUpload(
  formData: FormData,
): Promise<
  { ok: true; data: AboutProfileInput } | { ok: false; state: FormState }
> {
  const input = aboutProfileInputFromForm(formData);
  const pendingFile = fileFrom(formData, "portraitFile");
  if (pendingFile && !input.portraitUrl) {
    input.portraitUrl = UPLOAD_PLACEHOLDER;
  }

  const parsed = aboutProfileFormSchema.safeParse(input);
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

  let portraitUrl = parsed.data.portraitUrl || null;
  if (pendingFile && portraitUrl === UPLOAD_PLACEHOLDER) {
    try {
      portraitUrl = await uploadImage(pendingFile, "about");
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

  return {
    ok: true,
    data: { portraitUrl, translations: parsed.data.translations },
  };
}

export async function updateAboutProfileAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = formLocale(formData);
  await requireUser(locale);

  const result = await parseAndUpload(formData);
  if (!result.ok) return result.state;

  const { previousPortraitUrl } = await upsertAboutProfile(result.data);

  // Potret lama dibersihkan hanya kalau benar-benar diganti — bukan setiap
  // submit, atau potret yang tidak disentuh ikut terhapus dari storage.
  if (previousPortraitUrl && previousPortraitUrl !== result.data.portraitUrl) {
    await removeImages([previousPortraitUrl]);
  }

  revalidateAboutPaths();
  redirect(`/${locale}/dashboard/about`);
}
