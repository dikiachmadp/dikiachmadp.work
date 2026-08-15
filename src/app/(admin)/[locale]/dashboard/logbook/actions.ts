"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { removeImages, uploadImage } from "@/lib/storage";
import {
  formValues,
  logbookFormSchema,
  logbookInputFromForm,
  toFieldErrors,
  type FormState,
} from "@/schemas/admin";
import {
  createPostWithTranslations,
  deletePostById,
  updatePostWithTranslations,
  type LogbookPostInput,
} from "@/lib/db/logbook";
import { revalidateLogbookPaths } from "@/lib/db/revalidate";
import { pageQuery } from "@/lib/pagination";

const UPLOAD_PLACEHOLDER = "__upload__";
const LOCALES = ["en", "id"] as const;

/**
 * `formLocale` adalah field tersembunyi, jadi isinya dikendalikan klien.
 * Diteruskan mentah ke `redirect()`, `/evil.com` menghasilkan
 * `redirect("//evil.com/...")` yang protocol-relative — browser membacanya
 * sebagai domain lain. Dinormalkan di sini, sekali, untuk semua aksi di file
 * ini.
 */
function formLocale(formData: FormData): "en" | "id" {
  return formData.get("formLocale") === "id" ? "id" : "en";
}

function fileFrom(formData: FormData, name: string): File | null {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

/**
 * Validasi dulu, upload belakangan — supaya form yang invalid tidak
 * meninggalkan berkas yatim di Storage.
 */
async function parseAndUpload(
  formData: FormData,
): Promise<
  { ok: true; data: LogbookPostInput } | { ok: false; state: FormState }
> {
  const input = logbookInputFromForm(formData);

  // Gambar yang baru dipilih belum punya URL. Diisi penanda supaya lolos
  // validasi "URL wajib", lalu ditukar URL asli setelah unggahan berhasil.
  const pendingFiles = new Map<string, File>();
  for (const locale of LOCALES) {
    const translation = input.translations[locale];
    if (!translation) continue;
    translation.images.forEach((image, index) => {
      const file = fileFrom(
        formData,
        `translations.${locale}.images.${index}.file`,
      );
      if (!file || image.url) return;
      image.url = UPLOAD_PLACEHOLDER;
      pendingFiles.set(`${locale}.${index}`, file);
    });
  }

  const parsed = logbookFormSchema.safeParse(input);
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

  const data = parsed.data;
  try {
    for (const locale of LOCALES) {
      const translation = data.translations[locale];
      if (!translation) continue;
      for (const [index, image] of translation.images.entries()) {
        const file = pendingFiles.get(`${locale}.${index}`);
        if (!file) continue;
        // Slug sudah lolos `^[a-z0-9-]+$`, jadi prefix path-nya aman.
        image.url = await uploadImage(file, `logbook/${translation.slug}`);
      }
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

function currentSlugs(data: LogbookPostInput) {
  return LOCALES.flatMap((locale) => {
    const translation = data.translations[locale];
    return translation ? [{ locale, slug: translation.slug }] : [];
  });
}

function slugConflictState(formData: FormData): FormState {
  return {
    status: "error",
    message: "Slug sudah dipakai pos lain di bahasa yang sama.",
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

export async function createPostAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = formLocale(formData);
  await requireUser(locale);

  const result = await parseAndUpload(formData);
  if (!result.ok) return result.state;

  try {
    await createPostWithTranslations(result.data);
  } catch (error) {
    if (isUniqueViolation(error)) return slugConflictState(formData);
    throw error;
  }

  revalidateLogbookPaths({ slugs: currentSlugs(result.data) });
  redirect(`/${locale}/dashboard/logbook`);
}

export async function updatePostAction(
  id: string,
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = formLocale(formData);
  await requireUser(locale);

  const result = await parseAndUpload(formData);
  if (!result.ok) return result.state;

  let written;
  try {
    written = await updatePostWithTranslations(id, result.data);
  } catch (error) {
    if (isUniqueViolation(error)) return slugConflictState(formData);
    throw error;
  }

  // Gambar yang dilepas dari galeri tidak lagi dirujuk baris mana pun; tanpa
  // langkah ini berkasnya tetap publik selamanya.
  await removeImages(written.orphanedImageUrls);

  // Slug lama ikut direvalidasi: kalau hanya slug baru yang disentuh, URL lama
  // tetap tersaji dari cache sampai ISR kedaluwarsa.
  revalidateLogbookPaths({
    slugs: currentSlugs(result.data),
    previousSlugs: written.previousSlugs,
  });
  redirect(`/${locale}/dashboard/logbook`);
}

export async function deletePostAction(id: string, formData: FormData) {
  const locale = formLocale(formData);
  await requireUser(locale);

  const deleted = await deletePostById(id);
  await removeImages(deleted.imageUrls);

  revalidateLogbookPaths({ previousSlugs: deleted.slugs });
  // Kembali ke halaman tempat tombolnya ditekan, bukan selalu ke halaman 1.
  redirect(`/${locale}/dashboard/logbook${pageQuery(formData.get("page"))}`);
}
