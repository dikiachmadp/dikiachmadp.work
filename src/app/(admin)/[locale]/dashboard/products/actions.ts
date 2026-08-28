"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { removeImages, uploadImage } from "@/lib/storage";
import {
  digitalProductFormSchema,
  digitalProductInputFromForm,
  formValues,
  toFieldErrors,
  type FormState,
} from "@/schemas/admin";
import {
  createProductWithTranslations,
  deleteProductById,
  updateProductWithTranslations,
  type DigitalProductInput,
} from "@/lib/db/products";
import { revalidateProductPaths } from "@/lib/db/revalidate";
import { LANDING_SLOTS, type ProductLanding } from "@/schemas/product-landing";
import { pageQuery } from "@/lib/pagination";

const UPLOAD_PLACEHOLDER = "__upload__";
const LOCALES = ["en", "id"] as const;

/**
 * `formLocale` adalah field tersembunyi, jadi isinya dikendalikan klien.
 * Diteruskan mentah ke `redirect()`, `/evil.com` menghasilkan
 * `redirect("//evil.com/...")` yang protocol-relative. Dinormalkan di sini,
 * sama seperti `logbook/actions.ts` dan `about/actions.ts`.
 */
function formLocale(formData: FormData): "en" | "id" {
  return formData.get("formLocale") === "id" ? "id" : "en";
}

function fileFrom(formData: FormData, name: string): File | null {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

/**
 * Gambar di dalam seksi halaman jualan. Field URL-nya kosong untuk gambar yang
 * baru dipilih; berkasnya datang lewat input tersembunyi bersebelahan
 * (`…beforeImageFile`), lalu URL hasil unggahan ditulis balik ke itemnya.
 *
 * Daftar field gambarnya dibaca dari `LANDING_SLOTS`, bukan ditulis ulang —
 * menambah field gambar baru di satu tabel otomatis ikut terunggah di sini.
 */
async function uploadLandingImages(
  landing: ProductLanding,
  formData: FormData,
  pathPrefix: string,
) {
  for (const spec of LANDING_SLOTS) {
    const section = landing[spec.slot];
    if (!section) continue;

    const imageFields = spec.fields.filter((field) => field.kind === "image");
    if (imageFields.length === 0) continue;

    const items = section.items as Record<string, unknown>[];
    for (const [index, item] of items.entries()) {
      for (const field of imageFields) {
        const file = fileFrom(
          formData,
          `landing.${spec.slot}.items.${index}.${field.name}File`,
        );
        if (file) item[field.name] = await uploadImage(file, pathPrefix);
      }
    }
  }
}

/**
 * Validasi dulu, upload belakangan — supaya form yang invalid tidak
 * meninggalkan berkas yatim di Storage. Cover + galeri di sini (bukan per
 * bahasa) karena gambar produk melekat di induk, bukan di translation —
 * sama seperti Project, berbeda dari galeri Logbook.
 */
async function parseAndUpload(
  formData: FormData,
): Promise<
  { ok: true; data: DigitalProductInput } | { ok: false; state: FormState }
> {
  const input = digitalProductInputFromForm(formData);

  const coverFile = fileFrom(formData, "coverImageFile");
  const galleryFiles = formData
    .getAll("galleryFiles")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (coverFile && !input.coverImage) input.coverImage = UPLOAD_PLACEHOLDER;

  const parsed = digitalProductFormSchema.safeParse(input);
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
  // Prefix path bucket diturunkan dari slug bahasa mana pun yang terisi —
  // produk selalu punya minimal satu (skema menolak keduanya kosong).
  const slugPrefix =
    data.translations.en?.slug ?? data.translations.id?.slug ?? "product";

  try {
    if (coverFile) {
      data.coverImage = await uploadImage(coverFile, `products/${slugPrefix}`);
    }
    for (const file of galleryFiles) {
      data.gallery.push(await uploadImage(file, `products/${slugPrefix}`));
    }
    await uploadLandingImages(data.landing, formData, `products/${slugPrefix}`);
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

function currentSlugs(data: DigitalProductInput) {
  return LOCALES.flatMap((locale) => {
    const translation = data.translations[locale];
    return translation ? [{ locale, slug: translation.slug }] : [];
  });
}

function slugConflictState(formData: FormData): FormState {
  return {
    status: "error",
    message: "Slug sudah dipakai produk lain di bahasa yang sama.",
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

export async function createProductAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = formLocale(formData);
  await requireUser(locale);

  const result = await parseAndUpload(formData);
  if (!result.ok) return result.state;

  try {
    await createProductWithTranslations(result.data);
  } catch (error) {
    if (isUniqueViolation(error)) return slugConflictState(formData);
    throw error;
  }

  revalidateProductPaths({ slugs: currentSlugs(result.data) });
  redirect(`/${locale}/dashboard/products`);
}

export async function updateProductAction(
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
    written = await updateProductWithTranslations(id, result.data);
  } catch (error) {
    if (isUniqueViolation(error)) return slugConflictState(formData);
    throw error;
  }

  revalidateProductPaths({
    slugs: currentSlugs(result.data),
    previousSlugs: written.previousSlugs,
  });
  redirect(`/${locale}/dashboard/products`);
}

export async function deleteProductAction(id: string, formData: FormData) {
  const locale = formLocale(formData);
  await requireUser(locale);

  const deleted = await deleteProductById(id);
  await removeImages(deleted.imageUrls);

  revalidateProductPaths({ previousSlugs: deleted.slugs });
  redirect(`/${locale}/dashboard/products${pageQuery(formData.get("page"))}`);
}
