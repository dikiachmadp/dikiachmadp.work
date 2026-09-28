import { z } from "zod";
import { projectCategories } from "@/lib/categories";
import {
  BLOCK_KIND_SPECS,
  MAX_LIST_ENTRIES,
  isSafeImageUrl,
  isSafeLinkUrl,
  productBlocksSchema,
  type BlockKind,
  type BlockKindSpec,
} from "@/schemas/product-blocks";

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

/**
 * Ubah daftar isu Zod menjadi peta "path.bertitik" → pesan pertama.
 *
 * Sebagian larik disunting sebagai **satu** kontrol: galeri dan "apa yang kamu
 * dapat" adalah textarea satu butir per baris, begitu juga skills dan cvItems
 * di form About. Zod menunjuk elemennya (`gallery.1`,
 * `translations.en.skills.0.category`), padahal tidak ada input bernama itu —
 * yang dirender bernama `gallery` dan `translations.en.skills`. Tanpa alias di
 * bawah, isian ditolak tanpa satu pun pesan yang bisa ditemukan pemiliknya:
 * formnya cuma berkata "periksa isian yang ditandai" sambil tidak menandai apa
 * pun.
 *
 * Alias-nya adalah potongan path sampai sebelum angka terakhir, yaitu nama
 * larik itu sendiri, dengan nomor barisnya ikut disebut karena satu textarea
 * bisa memuat dua puluh baris. Galat yang benar-benar menunjuk sebuah field
 * selalu menang atas alias, dan alias yang tidak cocok dengan input mana pun
 * memang tidak pernah dibaca.
 */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  const put = (key: string, message: string) => {
    if (!(key in fieldErrors)) fieldErrors[key] = message;
  };

  for (const issue of error.issues) {
    put(issue.path.join("."), issue.message);
  }
  // Pass kedua, supaya alias tidak pernah mendahului galat yang tepat sasaran.
  for (const issue of error.issues) {
    const at = issue.path.findLastIndex((part) => typeof part === "number");
    if (at < 1) continue;
    put(
      issue.path.slice(0, at).join("."),
      `Baris ${(issue.path[at] as number) + 1}: ${issue.message}`,
    );
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

// --- About ---

/**
 * Skills sebagai satu baris per kategori: `Kategori: item satu, item dua`.
 * Bentuk baris teks ini, bukan repeater klien, karena datanya jarang berubah
 * dan strukturnya cuma dua tingkat — sama alasannya dengan `contentBlocks`
 * Project memakai baris kosong sebagai pemisah alih-alih textarea per blok.
 */
export function parseSkillsText(
  value: FormDataEntryValue | null,
): { category: string; items: string[] }[] {
  if (typeof value !== "string") return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [category, rest = ""] = line.split(":");
      return {
        category: category.trim(),
        items: rest
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
    });
}

export function skillsToText(
  skills: { category: string; items: string[] }[],
): string {
  return skills
    .map((group) => `${group.category}: ${group.items.join(", ")}`)
    .join("\n");
}

/** Satu baris per entri CV: `Label | href`. */
export function parseCvItemsText(
  value: FormDataEntryValue | null,
): { label: string; href: string }[] {
  if (typeof value !== "string") return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label = "", href = ""] = line.split("|");
      return { label: label.trim(), href: href.trim() };
    });
}

export function cvItemsToText(
  items: { label: string; href: string }[],
): string {
  return items.map((item) => `${item.label} | ${item.href}`).join("\n");
}

const aboutSkillGroupSchema = z.object({
  category: z.string().min(1, "Kategori wajib diisi"),
  items: z.array(z.string()).min(1, "Minimal satu item"),
});

const aboutCvItemSchema = z.object({
  label: z.string().min(1, "Label wajib diisi"),
  href: z.string().min(1, "Tautan wajib diisi"),
});

const aboutProfileTranslationSchema = z.object({
  biography: z.array(z.string()).min(1, "Biografi wajib diisi"),
  sticker: z.string().min(1, "Teks sticker wajib diisi"),
  experienceTitle: z.string().min(1, "Judul wajib diisi"),
  skillsTitle: z.string().min(1, "Judul wajib diisi"),
  certificationsTitle: z.string().min(1, "Judul wajib diisi"),
  cvNote: z.string().min(1, "Catatan CV wajib diisi"),
  skills: z.array(aboutSkillGroupSchema),
  cvItems: z.array(aboutCvItemSchema),
});

// About selalu tampil di kedua bahasa — tidak seperti Logbook, blok bahasa
// di sini wajib, bukan `.nullable()`.
export const aboutProfileFormSchema = z.object({
  portraitUrl: z.string().optional(),
  translations: z.object({
    en: aboutProfileTranslationSchema,
    id: aboutProfileTranslationSchema,
  }),
});

export type AboutProfileFormParsed = z.infer<typeof aboutProfileFormSchema>;

function aboutProfileTranslationFromForm(
  formData: FormData,
  locale: "en" | "id",
) {
  const p = (field: string) => `translations.${locale}.${field}`;
  return {
    biography: splitParagraphs(formData.get(p("biography"))) ?? [],
    sticker: text(formData, p("sticker")),
    experienceTitle: text(formData, p("experienceTitle")),
    skillsTitle: text(formData, p("skillsTitle")),
    certificationsTitle: text(formData, p("certificationsTitle")),
    cvNote: text(formData, p("cvNote")),
    skills: parseSkillsText(formData.get(p("skills"))),
    cvItems: parseCvItemsText(formData.get(p("cvItems"))),
  };
}

export function aboutProfileInputFromForm(formData: FormData) {
  return {
    portraitUrl: optionalText(formData, "portraitUrl"),
    translations: {
      en: aboutProfileTranslationFromForm(formData, "en"),
      id: aboutProfileTranslationFromForm(formData, "id"),
    },
  };
}

export const aboutEntryFormSchema = z.object({
  kind: z.enum(["EXPERIENCE", "CERTIFICATION"]),
  locale: z.enum(["en", "id"]),
  order: z.coerce.number().int().min(0),
  year: z.string().min(1, "Tahun wajib diisi"),
  title: z.string().min(1, "Judul wajib diisi"),
  subtitle: z.string().min(1, "Subjudul wajib diisi"),
  url: z.union([z.url("URL tidak valid"), z.literal("")]).optional(),
});

export type AboutEntryFormValues = z.infer<typeof aboutEntryFormSchema>;

export function aboutEntryInputFromForm(formData: FormData) {
  return {
    kind: text(formData, "kind") || "EXPERIENCE",
    locale: text(formData, "locale") || "en",
    order: text(formData, "order") || "0",
    year: text(formData, "year"),
    title: text(formData, "title"),
    subtitle: text(formData, "subtitle"),
    url: optionalText(formData, "url"),
  };
}

// --- Digital Products ---

/**
 * Boleh kosong. Dulu wajib, yang memaksa tiap produk mengarang prosa walau
 * seluruh ceritanya sudah diceritakan blok halaman jualan dan daftar "apa yang
 * kamu dapat". Batas ukurannya tetap.
 */
const digitalProductBodySchema = z
  .string()
  .refine(
    (value) => new TextEncoder().encode(value).length <= MAX_BODY_BYTES,
    `Isi maksimal ${MAX_BODY_BYTES / 1024} kB.`,
  );

const digitalProductTranslationSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug wajib diisi")
    .regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan tanda hubung"),
  title: z.string().min(1, "Judul wajib diisi"),
  summary: z.string().min(1, "Ringkasan wajib diisi"),
  body: digitalProductBodySchema,
  /**
   * "Apa yang kamu dapat". Melekat di produk, bukan pada paket yang ditandai
   * `recommended` seperti dulu — produk satu berkas tidak perlu mengarang
   * tabel paket hanya supaya kartu belinya terisi.
   */
  deliverables: z.array(z.string().max(300)).max(MAX_LIST_ENTRIES),
});

// Harga kosong berarti "belum ditetapkan", bukan gratis — dibedakan dari
// "0.00" yang berarti produk memang gratis.
const priceSchema = z.union([
  z.literal(""),
  z.string().regex(/^\d+(\.\d{1,2})?$/, "Harga berformat 19.99"),
]);

export const digitalProductFormSchema = z
  .object({
    status: z.enum(["DRAFT", "PUBLISHED"]),
    publishedAt: localDateTimeSchema,
    featured: z.boolean(),
    order: z.coerce.number().int().min(0),
    price: priceSchema,
    currency: z.string().min(1, "Mata uang wajib diisi"),
    // Boleh kosong sejak checkout on-site ada — produk yang dijual lewat Polar
    // tidak punya toko eksternal. `.refine()` di bawah yang memastikan produk
    // tidak berakhir tanpa cara beli sama sekali.
    buyUrl: z.union([z.url("URL tidak valid"), z.literal("")]),
    polarProductId: z.string(),
    pwywEnabled: z.boolean(),
    // Sen. Angka, bukan dolar, supaya tidak ada pembulatan biner di jalan.
    pwywMinAmount: z.coerce.number().int().min(0),
    // Cover dan galeri kini lewat aturan aman yang sama dengan gambar di
    // dalam blok. Sebelumnya hanya gambar blok yang diperiksa — inkonsistensi
    // yang membuat URL host asing bisa masuk lewat pintu depan.
    coverImage: z
      .string()
      .min(1, "Gambar cover wajib diisi (URL atau upload)")
      .refine(
        isSafeImageUrl,
        "Gambar harus hasil unggahan atau path yang diawali /",
      ),
    gallery: z.array(
      z
        .string()
        .max(500)
        .refine(
          isSafeImageUrl,
          "Gambar harus hasil unggahan atau path yang diawali /",
        ),
    ),
    tags: z.array(z.string()),
    // Kosong -> tombol demo tidak dirender sama sekali.
    demoUrl: z
      .string()
      .max(500)
      .refine(isSafeLinkUrl, "Tautan harus https:// atau path yang diawali /"),
    blocks: productBlocksSchema,
    translations: z.object({
      // Terjemahan opsional per produk — sama seperti Logbook: blok bahasa
      // yang dikosongkan seluruhnya berarti produk itu tidak ada di bahasa
      // tersebut.
      en: digitalProductTranslationSchema.nullable(),
      id: digitalProductTranslationSchema.nullable(),
    }),
  })
  .refine(
    (data) => data.translations.en !== null || data.translations.id !== null,
    {
      message:
        "Isi setidaknya satu bahasa — produk kosong tidak muncul di mana pun.",
      path: ["translations"],
    },
  )
  // Produk tanpa keduanya tidak bisa dibeli lewat jalur mana pun: tombolnya
  // tidak punya tujuan. Lebih baik ditolak di sini daripada terbit sebagai
  // halaman buntu.
  .refine((data) => data.polarProductId !== "" || data.buyUrl !== "", {
    message: "Isi Polar product ID atau URL toko eksternal.",
    path: ["polarProductId"],
  })
  .transform((data) => ({
    ...data,
    price: data.price === "" ? null : data.price,
    buyUrl: data.buyUrl === "" ? null : data.buyUrl,
    demoUrl: data.demoUrl === "" ? null : data.demoUrl,
    polarProductId: data.polarProductId === "" ? null : data.polarProductId,
    // Draf tidak punya tanggal terbit. Produk terbit tanpa tanggal eksplisit
    // dianggap terbit sekarang — sama seperti Logbook.
    publishedAt:
      data.status === "PUBLISHED"
        ? data.publishedAt
          ? new Date(`${data.publishedAt}Z`)
          : new Date()
        : null,
  }));

export type DigitalProductFormParsed = z.infer<typeof digitalProductFormSchema>;

function digitalProductTranslationFromForm(
  formData: FormData,
  locale: "en" | "id",
) {
  const p = (field: string) => `translations.${locale}.${field}`;
  const translation = {
    slug: text(formData, p("slug")),
    title: text(formData, p("title")),
    summary: text(formData, p("summary")),
    body: text(formData, p("body")),
    deliverables: splitLines(formData.get(p("deliverables"))),
  };

  // `deliverables` ikut dihitung: kalau tidak, mengisi daftar "apa yang kamu
  // dapat" tanpa slug akan menghilang tanpa satu pun pesan galat.
  const isEmpty =
    !translation.slug &&
    !translation.title &&
    !translation.summary &&
    !translation.body &&
    translation.deliverables.length === 0;

  return isEmpty ? null : translation;
}

/**
 * Blok halaman jualan. Sama seperti `imagesFromForm`, isinya dikirim sebagai
 * field berindeks (`blocks.2.items.0.label.id`) supaya urutan di layar adalah
 * urutan yang tersimpan dan path galat Zod langsung cocok dengan nama input
 * tanpa pemetaan manual di `toFieldErrors`.
 *
 * Daftar field-nya tidak ditulis ulang di sini — dibaca dari
 * `BLOCK_KIND_SPECS` di product-blocks.ts, jadi menambah field cukup menyunting
 * satu tabel.
 */
function localizedTextFromForm(formData: FormData, prefix: string) {
  return {
    en: text(formData, `${prefix}.en`),
    id: text(formData, `${prefix}.id`),
  };
}

function blockItemFromForm(
  formData: FormData,
  spec: BlockKindSpec,
  prefix: string,
) {
  const item: Record<string, unknown> = {};
  for (const field of spec.fields) {
    const name = `${prefix}.${field.name}`;
    if (field.kind === "flag") {
      item[field.name] = formData.get(name) === "on";
    } else if (field.kind === "lines") {
      item[field.name] = {
        en: splitLines(formData.get(`${name}.en`)),
        id: splitLines(formData.get(`${name}.id`)),
      };
    } else if (field.localized) {
      item[field.name] = localizedTextFromForm(formData, name);
    } else {
      item[field.name] = text(formData, name);
    }
  }
  return item;
}

/**
 * Blok itu posisional, jadi kuncinya sendiri tidak lagi memberi tahu apa yang
 * sedang dibaca. Tiga input tersembunyi per blok yang menutupinya: `present`
 * menandai indeks itu terpakai (penanda yang sama dipakai daftar item),
 * `kind` memilih skema item mana yang berlaku, dan `id` membawa uuid yang
 * dicetak penyunting supaya jangkar blok tidak berganti tiap kali disimpan.
 */
export function blocksFromForm(formData: FormData) {
  const blocks: Record<string, unknown>[] = [];

  for (let index = 0; ; index++) {
    const prefix = `blocks.${index}`;
    if (formData.get(`${prefix}.present`) === null) break;

    const kind = text(formData, `${prefix}.kind`);
    const spec = BLOCK_KIND_SPECS[kind as BlockKind] as
      BlockKindSpec | undefined;

    const block: Record<string, unknown> = {
      id: text(formData, `${prefix}.id`),
      kind,
      heading: localizedTextFromForm(formData, `${prefix}.heading`),
      intro: localizedTextFromForm(formData, `${prefix}.intro`),
      items: [] as Record<string, unknown>[],
    };

    // Jenis yang tidak dikenal tetap didorong apa adanya, bukan dilewati:
    // melewatinya menggeser indeks sisanya dan membuat setiap path galat Zod
    // menunjuk input yang salah. Biar skema yang menolaknya.
    if (spec) {
      if (spec.styles) {
        const style = text(formData, `${prefix}.style`);
        // Kosong berarti "pakai bawaan"; skema yang mengisinya.
        if (style !== "") block.style = style;
      }

      const items: Record<string, unknown>[] = [];
      for (let itemIndex = 0; ; itemIndex++) {
        // Penanda tersembunyi yang selalu dirender tiap item; ketiadaannya
        // menandai akhir daftar. Tidak bisa memakai field biasa — checkbox
        // yang tidak dicentang dan gambar yang belum diunggah sama-sama absen.
        if (formData.get(`${prefix}.items.${itemIndex}.present`) === null) {
          break;
        }
        items.push(
          blockItemFromForm(formData, spec, `${prefix}.items.${itemIndex}`),
        );
      }
      block.items = items;
    }

    blocks.push(block);
  }

  return blocks;
}

export function digitalProductInputFromForm(formData: FormData) {
  return {
    status: text(formData, "status") || "DRAFT",
    publishedAt: text(formData, "publishedAt"),
    featured: formData.get("featured") === "on",
    order: text(formData, "order") || "0",
    price: text(formData, "price"),
    currency: text(formData, "currency") || "USD",
    buyUrl: text(formData, "buyUrl"),
    polarProductId: text(formData, "polarProductId"),
    pwywEnabled: formData.get("pwywEnabled") === "on",
    pwywMinAmount: text(formData, "pwywMinAmount") || "0",
    coverImage: text(formData, "coverImage"),
    gallery: splitLines(formData.get("gallery")),
    tags: splitList(formData.get("tags")),
    demoUrl: text(formData, "demoUrl"),
    blocks: blocksFromForm(formData),
    translations: {
      en: digitalProductTranslationFromForm(formData, "en"),
      id: digitalProductTranslationFromForm(formData, "id"),
    },
  };
}
