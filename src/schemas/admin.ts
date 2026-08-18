import { z } from "zod";
import { projectCategories } from "@/lib/categories";

// Schema validasi form admin. Dipakai server action lewat safeParse;
// error per field dikembalikan ke client melalui FormState.

export type FormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  // Nilai form yang dikirim, dipakai ulang sebagai defaultValue agar input
  // tidak hilang saat validasi gagal (React me-reset form setelah action).
  values?: Record<string, string>;
};

export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }
  return values;
}

export const initialFormState: FormState = { status: "idle" };

const translationSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  client: z.string().min(1, "Nama klien wajib diisi"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  role: z.string().optional(),
  duration: z.string().optional(),
  contentBlocks: z.array(z.string()).optional(),
});

export const projectFormSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug wajib diisi")
    .regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan tanda hubung"),
  // Harus salah satu kunci yang benar-benar punya label di projects.json.
  // Kunci asing lolos regex tapi tidak punya terjemahan, jadi kartunya akan
  // menampilkan kunci mentah — dan chip filter tidak akan pernah cocok.
  categoryKey: z
    .string()
    .min(1, "Kategori wajib dipilih")
    .refine(
      (key) => projectCategories("en").some((cat) => cat.key === key),
      "Kategori tidak dikenal",
    ),
  year: z.string().regex(/^\d{4}$/, "Tahun berformat YYYY"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal berformat YYYY-MM-DD"),
  coverImage: z.string().min(1, "Gambar cover wajib diisi (URL atau upload)"),
  logoUrl: z.string().optional(),
  featured: z.boolean(),
  liveUrl: z.union([z.url("URL tidak valid"), z.literal("")]).optional(),
  isLivePreview: z.boolean(),
  tags: z.array(z.string()),
  tools: z.array(z.string()),
  gallery: z.array(z.string()),
  translations: z.object({
    en: translationSchema,
    id: translationSchema,
  }),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const testimonialFormSchema = z.object({
  locale: z.enum(["en", "id"]),
  name: z.string().min(1, "Nama wajib diisi"),
  role: z.string().min(1, "Peran wajib diisi"),
  content: z.string().min(1, "Isi testimonial wajib diisi"),
  avatarUrl: z.string().optional(),
  projectRef: z.string().optional(),
  order: z.coerce.number().int().min(0),
});

export type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

// --- Logbook ---

/** Batas isi tulisan, dihitung dalam byte UTF-8, bukan jumlah karakter. */
export const MAX_BODY_BYTES = 100 * 1024;

const logbookImageSchema = z.object({
  url: z.string().min(1, "URL gambar wajib diisi"),
  // Wajib: galeri tanpa teks alternatif tidak bisa diakses, dan `alt` inilah
  // alasan gambar melekat pada terjemahan alih-alih pada pos.
  alt: z.string().min(1, "Teks alternatif wajib diisi"),
  caption: z.string().optional(),
});

const logbookBodySchema = z
  .string()
  .min(1, "Isi tulisan wajib diisi")
  .refine(
    (value) => new TextEncoder().encode(value).length <= MAX_BODY_BYTES,
    `Isi tulisan maksimal ${MAX_BODY_BYTES / 1024} kB.`,
  );

const logbookTranslationSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug wajib diisi")
    .regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan tanda hubung"),
  title: z.string().min(1, "Judul wajib diisi"),
  excerpt: z.string().min(1, "Ringkasan wajib diisi"),
  body: logbookBodySchema,
  images: z.array(logbookImageSchema),
});

/**
 * `datetime-local` mengirim waktu tanpa zona: "2026-08-15T09:30".
 *
 * Zonanya diperlakukan sebagai **UTC**, bukan zona peramban maupun zona server.
 * Field-nya dirender di server (Vercel berjalan di UTC) tapi diisi admin di
 * WIB; menafsirkannya sebagai "lokal" berarti nilai yang sama berpindah makna
 * tergantung siapa yang merender. Label field-nya menyebut UTC.
 */
const localDateTimeSchema = z.union([
  z.literal(""),
  z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/,
      "Tanggal terbit berformat YYYY-MM-DDTHH:MM",
    ),
]);

export const logbookFormSchema = z
  .object({
    status: z.enum(["DRAFT", "PUBLISHED"]),
    publishedAt: localDateTimeSchema,
    translations: z.object({
      // Terjemahan opsional per pos: blok bahasa yang dikosongkan seluruhnya
      // berarti pos itu memang tidak ada di bahasa tersebut.
      en: logbookTranslationSchema.nullable(),
      id: logbookTranslationSchema.nullable(),
    }),
  })
  .refine(
    (data) => data.translations.en !== null || data.translations.id !== null,
    {
      message:
        "Isi setidaknya satu bahasa — pos kosong tidak muncul di mana pun.",
      path: ["translations"],
    },
  )
  .transform((data) => ({
    ...data,
    // Draf tidak punya tanggal terbit. Pos terbit tanpa tanggal eksplisit
    // dianggap terbit sekarang; mengisinya sendiri berarti menjadwalkan.
    publishedAt:
      data.status === "PUBLISHED"
        ? data.publishedAt
          ? new Date(`${data.publishedAt}Z`)
          : new Date()
        : null,
  }));

/** Kebalikan dari parsing di atas: `Date` → nilai `datetime-local` dalam UTC. */
export function toDateTimeLocalUtc(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 16);
}

export type LogbookFormParsed = z.infer<typeof logbookFormSchema>;

// Ubah daftar isu Zod menjadi peta "path.bertitik" → pesan pertama.
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

// --- Helper parsing FormData ---

export function splitList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function splitLines(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function splitParagraphs(
  value: FormDataEntryValue | null,
): string[] | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, name: string): string | undefined {
  const value = text(formData, name);
  return value === "" ? undefined : value;
}

function translationFromForm(formData: FormData, locale: "en" | "id") {
  const p = (field: string) => `translations.${locale}.${field}`;
  return {
    title: text(formData, p("title")),
    client: text(formData, p("client")),
    description: text(formData, p("description")),
    role: optionalText(formData, p("role")),
    duration: optionalText(formData, p("duration")),
    contentBlocks: splitParagraphs(formData.get(p("contentBlocks"))),
  };
}

export function projectInputFromForm(formData: FormData) {
  return {
    slug: text(formData, "slug"),
    categoryKey: text(formData, "categoryKey"),
    year: text(formData, "year"),
    date: text(formData, "date"),
    coverImage: text(formData, "coverImage"),
    logoUrl: optionalText(formData, "logoUrl"),
    featured: formData.get("featured") === "on",
    liveUrl: text(formData, "liveUrl"),
    isLivePreview: formData.get("isLivePreview") === "on",
    tags: splitList(formData.get("tags")),
    tools: splitList(formData.get("tools")),
    gallery: splitLines(formData.get("gallery")),
    translations: {
      en: translationFromForm(formData, "en"),
      id: translationFromForm(formData, "id"),
    },
  };
}

/**
 * Galeri dikirim sebagai field berindeks (`…images.0.alt`, `…images.1.alt`, …)
 * supaya urutannya adalah urutan di form, dan supaya path error Zod
 * (`translations.en.images.0.alt`) langsung cocok dengan nama input tanpa
 * pemetaan manual di `toFieldErrors`.
 */
function imagesFromForm(formData: FormData, locale: "en" | "id") {
  const prefix = `translations.${locale}.images`;
  const images: { url: string; alt: string; caption?: string }[] = [];

  for (let index = 0; ; index++) {
    // `url` selalu dirender (kosong untuk gambar yang baru diunggah), jadi
    // ketiadaannya menandai akhir daftar.
    if (formData.get(`${prefix}.${index}.url`) === null) break;
    images.push({
      url: text(formData, `${prefix}.${index}.url`),
      alt: text(formData, `${prefix}.${index}.alt`),
      caption: optionalText(formData, `${prefix}.${index}.caption`),
    });
  }
  return images;
}

function logbookTranslationFromForm(formData: FormData, locale: "en" | "id") {
  const p = (field: string) => `translations.${locale}.${field}`;
  const translation = {
    slug: text(formData, p("slug")),
    title: text(formData, p("title")),
    excerpt: text(formData, p("excerpt")),
    body: text(formData, p("body")),
    images: imagesFromForm(formData, locale),
  };

  const isEmpty =
    !translation.slug &&
    !translation.title &&
    !translation.excerpt &&
    !translation.body &&
    translation.images.length === 0;

  return isEmpty ? null : translation;
}

export function logbookInputFromForm(formData: FormData) {
  return {
    status: text(formData, "status") || "DRAFT",
    publishedAt: text(formData, "publishedAt"),
    translations: {
      en: logbookTranslationFromForm(formData, "en"),
      id: logbookTranslationFromForm(formData, "id"),
    },
  };
}

export function testimonialInputFromForm(formData: FormData) {
  return {
    locale: text(formData, "locale"),
    name: text(formData, "name"),
    role: text(formData, "role"),
    content: text(formData, "content"),
    avatarUrl: optionalText(formData, "avatarUrl"),
    projectRef: optionalText(formData, "projectRef"),
    order: text(formData, "order") || "0",
  };
}
