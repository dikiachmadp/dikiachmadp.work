import { z } from "zod";

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
  category: z.string().min(1, "Label kategori wajib diisi"),
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
  categoryKey: z
    .string()
    .min(1, "Kunci kategori wajib diisi")
    .regex(/^[a-z0-9-]+$/, "Kunci kategori hanya huruf kecil/angka/hubung"),
  year: z.string().regex(/^\d{4}$/, "Tahun berformat YYYY"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal berformat YYYY-MM-DD"),
  coverImage: z.string().min(1, "Gambar cover wajib diisi (URL atau upload)"),
  logoUrl: z.string().optional(),
  accent: z.string().optional(),
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
    category: text(formData, p("category")),
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
    accent: optionalText(formData, "accent"),
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
