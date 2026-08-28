import { z } from "zod";

/**
 * Halaman jualan produk digital: delapan seksi bernama, semuanya opsional,
 * disimpan sebagai satu kolom `jsonb` di `DigitalProduct.landing`.
 *
 * **Template tetap, bukan penyusun blok.** Urutan seksi ditentukan kode (lihat
 * `LANDING_SLOTS`) dan mengikuti pola halaman jualan: kail → bantahan keberatan
 * → bukti → kelengkapan → pilihan → sisa keraguan. Admin mengisi *makna*, kode
 * yang menentukan *rupa* — jadi mengubah desain halaman produk cukup mengubah
 * satu komponen, dan mustahil ada produk yang tampil rusak karena salah susun.
 *
 * **Aturan evolusi skema.** Kolom `jsonb` tidak ikut bermigrasi: baris lama
 * tetap berbentuk lama saat kode berubah. Karena itu — jangan pernah mengganti
 * nama atau mendaur ulang makna sebuah field. Tambah field baru yang opsional
 * dengan default. Kalau perubahan merusak tak terhindarkan, tulis satu skrip
 * yang menulis ulang kolom ini; datanya di satu tabel dengan sedikit baris.
 *
 * Field teks selalu berpasangan `{ en, id }`; field non-teks (gambar, warna,
 * URL, boolean) tunggal — supaya gambar dan tautan mustahil melenceng antar
 * bahasa. Bandingkan dengan catatan di prisma/schema.prisma: gambar melekat di
 * induk, bukan di translation.
 */

// --- Batas ---------------------------------------------------------------
// Bukan angka hiasan: tanpa batas, satu tempelan tak sengaja bisa menaruh
// baris multi-MB yang ikut terkirim di setiap render halaman produk.

export const MAX_ITEMS_PER_SECTION = 24;
export const MAX_LIST_ENTRIES = 20;
const SHORT = 300;
const MEDIUM = 1_200;
const LONG = 4_000;

// --- Keamanan URL --------------------------------------------------------

/**
 * `ctaUrl` dan `linkUrl` berakhir di atribut `href`. Validasi "URL yang sah"
 * saja meloloskan `javascript:…`, dan itu XSS tersimpan yang dipicu satu klik
 * pengunjung — jadi protokolnya di-allowlist, bukan sekadar dicek bentuknya.
 */
export function isSafeLinkUrl(value: string): boolean {
  if (value === "") return true;
  // Path relatif boleh; "//" ditolak karena protocol-relative membawa host asing.
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const BUCKET_PATH_PREFIX = "/storage/v1/object/public/";

/**
 * Gambar hanya boleh dari hasil unggahan sendiri atau aset lokal. `next/image`
 * sudah gagal-tertutup lewat `remotePatterns` di next.config.ts, tapi ditolak
 * saat validasi jauh lebih baik daripada muncul sebagai gambar rusak.
 */
export function isSafeImageUrl(value: string): boolean {
  if (value === "") return true;
  if (value.startsWith("/")) return !value.startsWith("//");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    url.hostname.endsWith(".supabase.co") &&
    url.pathname.startsWith(BUCKET_PATH_PREFIX)
  );
}

const linkUrlSchema = z
  .string()
  .max(500)
  .refine(isSafeLinkUrl, "Tautan harus https:// atau path yang diawali /");

const imageUrlSchema = z
  .string()
  .max(500)
  .refine(
    isSafeImageUrl,
    "Gambar harus hasil unggahan atau path yang diawali /",
  );

// --- Bentuk dwibahasa ----------------------------------------------------

const localizedText = (max: number) =>
  z.object({ en: z.string().max(max), id: z.string().max(max) });

const localizedLines = (max: number) =>
  z.object({
    en: z.array(z.string().max(max)).max(MAX_LIST_ENTRIES),
    id: z.array(z.string().max(max)).max(MAX_LIST_ENTRIES),
  });

export type LocalizedText = z.infer<ReturnType<typeof localizedText>>;

// --- Enam bentuk seksi ---------------------------------------------------
// Field kosong berarti "tidak diisi". Tidak ada `.optional()` di level field
// supaya bolak-balik FormData tidak pernah ambigu antara kosong dan hilang.

const sectionHead = {
  heading: localizedText(SHORT),
  intro: localizedText(MEDIUM),
};

const items = <T extends z.ZodTypeAny>(item: T) =>
  z.array(item).max(MAX_ITEMS_PER_SECTION);

const listSection = z.object({
  ...sectionHead,
  items: items(
    z.object({ label: localizedText(SHORT), detail: localizedText(MEDIUM) }),
  ),
});

const comparisonsSection = z.object({
  ...sectionHead,
  items: items(
    z.object({
      title: localizedText(SHORT),
      detail: localizedText(LONG),
      beforeImage: imageUrlSchema,
      beforeLabel: localizedText(SHORT),
      afterImage: imageUrlSchema,
      afterLabel: localizedText(SHORT),
    }),
  ),
});

const variantsSection = z.object({
  ...sectionHead,
  items: items(
    z.object({
      name: localizedText(SHORT),
      // Nilainya masuk ke atribut `style`, jadi bentuknya dikunci.
      hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna berformat #1f4433"),
      description: localizedText(MEDIUM),
      image: imageUrlSchema,
      // Kosong berarti demo untuk varian ini belum ada — tombolnya tidak
      // dirender sama sekali, bukan dirender sebagai tautan mati.
      linkUrl: linkUrlSchema,
    }),
  ),
});

const tiersSection = z.object({
  ...sectionHead,
  items: items(
    z.object({
      name: localizedText(SHORT),
      price: localizedText(SHORT),
      priceNote: localizedText(SHORT),
      summary: localizedText(MEDIUM),
      includes: localizedLines(SHORT),
      excludes: localizedLines(SHORT),
      ctaLabel: localizedText(SHORT),
      ctaUrl: linkUrlSchema,
      recommended: z.boolean(),
    }),
  ),
});

const faqSection = z.object({
  ...sectionHead,
  items: items(
    z.object({ question: localizedText(SHORT), answer: localizedText(LONG) }),
  ),
});

const gallerySection = z.object({
  ...sectionHead,
  items: items(
    z.object({ image: imageUrlSchema, caption: localizedText(SHORT) }),
  ),
});

// --- Delapan slot --------------------------------------------------------

export const ProductLandingSchema = z.object({
  positioning: listSection.optional(),
  proof: comparisonsSection.optional(),
  features: listSection.optional(),
  variants: variantsSection.optional(),
  tiers: tiersSection.optional(),
  specs: listSection.optional(),
  faq: faqSection.optional(),
  gallery: gallerySection.optional(),
});

export type ProductLanding = z.infer<typeof ProductLandingSchema>;
export type LandingSlot = keyof ProductLanding;

// --- Tabel deskriptor ----------------------------------------------------
/**
 * Satu sumber kebenaran untuk urutan seksi, label form, dan daftar field.
 * Form admin merender dari tabel ini, parser FormData membacanya dari sini,
 * dan komponen render mengambil `layout` dari sini — jadi menambah field
 * berarti menyunting satu tabel, bukan tiga berkas.
 */

export type LandingFieldKind =
  "text" | "textarea" | "lines" | "image" | "url" | "color" | "flag";

export type LandingFieldSpec = {
  name: string;
  label: string;
  kind: LandingFieldKind;
  /** Dirender sebagai sepasang input EN/ID dan disimpan sebagai `{en, id}`. */
  localized: boolean;
  hint?: string;
};

export type LandingSlotSpec = {
  slot: LandingSlot;
  legend: string;
  hint: string;
  itemLabel: string;
  /** Tata letak render. Ditentukan kode, tidak pernah disimpan sebagai data. */
  layout?: "points" | "cards" | "specs";
  /** Item dianggap kosong kalau semua field ini kosong di bahasa itu. */
  requires: string[];
  fields: LandingFieldSpec[];
};

const listFields: LandingFieldSpec[] = [
  { name: "label", label: "Label", kind: "text", localized: true },
  { name: "detail", label: "Penjelasan", kind: "textarea", localized: true },
];

export const LANDING_SLOTS: LandingSlotSpec[] = [
  {
    slot: "positioning",
    legend: "1 · Posisi produk",
    hint: "Bantahan atas keberatan terbesar pembaca, ditaruh paling atas.",
    itemLabel: "Poin",
    layout: "points",
    requires: ["label", "detail"],
    fields: listFields,
  },
  {
    slot: "proof",
    legend: "2 · Bukti",
    hint: "Perbandingan sebelum/sesudah. Item tanpa gambar dirender sebagai teks saja.",
    itemLabel: "Bukti",
    requires: ["title", "beforeImage", "afterImage"],
    fields: [
      { name: "title", label: "Judul", kind: "text", localized: true },
      {
        name: "detail",
        label: "Penjelasan",
        kind: "textarea",
        localized: true,
      },
      {
        name: "beforeImage",
        label: "Gambar sebelum",
        kind: "image",
        localized: false,
      },
      {
        name: "beforeLabel",
        label: "Keterangan sebelum",
        kind: "text",
        localized: true,
      },
      {
        name: "afterImage",
        label: "Gambar sesudah",
        kind: "image",
        localized: false,
      },
      {
        name: "afterLabel",
        label: "Keterangan sesudah",
        kind: "text",
        localized: true,
      },
    ],
  },
  {
    slot: "features",
    legend: "3 · Fitur",
    hint: "Dirender sebagai kisi kartu.",
    itemLabel: "Fitur",
    layout: "cards",
    requires: ["label", "detail"],
    fields: listFields,
  },
  {
    slot: "variants",
    legend: "4 · Varian",
    hint: "Pilihan warna atau ragam. Tautan kosong berarti tombolnya tidak dirender.",
    itemLabel: "Varian",
    requires: ["name"],
    fields: [
      { name: "name", label: "Nama", kind: "text", localized: true },
      {
        name: "hex",
        label: "Warna",
        kind: "color",
        localized: false,
        hint: "Format #1f4433.",
      },
      {
        name: "description",
        label: "Keterangan",
        kind: "textarea",
        localized: true,
      },
      {
        name: "image",
        label: "Tangkapan layar",
        kind: "image",
        localized: false,
      },
      {
        name: "linkUrl",
        label: "Tautan demo",
        kind: "url",
        localized: false,
        hint: "Kosongkan bila demo belum ada.",
      },
    ],
  },
  {
    slot: "tiers",
    legend: "5 · Paket",
    hint: "Tautan checkout wajib https://. Paket tanpa tautan tombolnya dinonaktifkan.",
    itemLabel: "Paket",
    requires: ["name"],
    fields: [
      { name: "name", label: "Nama paket", kind: "text", localized: true },
      { name: "price", label: "Harga", kind: "text", localized: true },
      {
        name: "priceNote",
        label: "Catatan harga",
        kind: "text",
        localized: true,
      },
      {
        name: "summary",
        label: "Ringkasan",
        kind: "textarea",
        localized: true,
      },
      {
        name: "includes",
        label: "Termasuk",
        kind: "lines",
        localized: true,
        hint: "Satu butir per baris.",
      },
      {
        name: "excludes",
        label: "Tidak termasuk",
        kind: "lines",
        localized: true,
        hint: "Satu butir per baris.",
      },
      { name: "ctaLabel", label: "Teks tombol", kind: "text", localized: true },
      {
        name: "ctaUrl",
        label: "Tautan checkout",
        kind: "url",
        localized: false,
      },
      {
        name: "recommended",
        label: "Paket yang disarankan",
        kind: "flag",
        localized: false,
      },
    ],
  },
  {
    slot: "specs",
    legend: "6 · Syarat",
    hint: "Dirender sebagai tabel label/nilai.",
    itemLabel: "Syarat",
    layout: "specs",
    requires: ["label", "detail"],
    fields: listFields,
  },
  {
    slot: "faq",
    legend: "7 · Tanya jawab",
    hint: "Jawaban mendukung Markdown, jadi boleh memuat tautan.",
    itemLabel: "Butir",
    requires: ["question"],
    fields: [
      { name: "question", label: "Pertanyaan", kind: "text", localized: true },
      { name: "answer", label: "Jawaban", kind: "textarea", localized: true },
    ],
  },
  {
    slot: "gallery",
    legend: "8 · Galeri",
    hint: "Tangkapan layar berketerangan di bagian bawah halaman.",
    itemLabel: "Gambar",
    requires: ["image"],
    fields: [
      { name: "image", label: "Gambar", kind: "image", localized: false },
      { name: "caption", label: "Keterangan", kind: "text", localized: true },
    ],
  },
];

export const LANDING_SLOT_BY_NAME: Record<LandingSlot, LandingSlotSpec> =
  Object.fromEntries(LANDING_SLOTS.map((spec) => [spec.slot, spec])) as Record<
    LandingSlot,
    LandingSlotSpec
  >;

/** Semua URL gambar di dalam landing — dipakai saat menghapus produk. */
export function landingImageUrls(landing: ProductLanding): string[] {
  const urls: string[] = [];
  for (const spec of LANDING_SLOTS) {
    const section = landing[spec.slot];
    if (!section) continue;
    const imageFields = spec.fields.filter((f) => f.kind === "image");
    for (const item of section.items as Record<string, unknown>[]) {
      for (const field of imageFields) {
        const value = item[field.name];
        if (typeof value === "string" && value !== "") urls.push(value);
      }
    }
  }
  return urls;
}

// --- Pelokalan -----------------------------------------------------------

type Locale = "en" | "id";

/** Meratakan setiap pasangan `{en, id}` jadi nilai tunggal. */
type Localize<T> = T extends { en: infer V; id: infer V }
  ? V
  : T extends (infer U)[]
    ? Localize<U>[]
    : T extends object
      ? { [K in keyof T]: Localize<T[K]> }
      : T;

export type LocalizedProductLanding = Localize<ProductLanding>;
export type LocalizedLandingSection<S extends LandingSlot> = NonNullable<
  LocalizedProductLanding[S]
>;

function localizeValue(value: unknown, locale: Locale): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => localizeValue(entry, locale));
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    // Satu-satunya objek berkunci tepat {en, id} di skema ini adalah teks
    // dwibahasa — tidak ada seksi atau item yang berbentuk begitu.
    if (keys.length === 2 && "en" in record && "id" in record) {
      return record[locale];
    }
    return Object.fromEntries(
      Object.entries(record).map(([key, entry]) => [
        key,
        localizeValue(entry, locale),
      ]),
    );
  }
  return value;
}

function hasContent(spec: LandingSlotSpec, item: Record<string, unknown>) {
  return spec.requires.some((name) => {
    const value = item[name];
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === "string" && value.trim() !== "";
  });
}

/**
 * Membuang seksi yang tidak layak tayang di bahasa ini: judulnya kosong, atau
 * tidak menyisakan satu pun item yang terisi. Produk yang hanya diterjemahkan
 * sebagian karena itu tidak pernah menampilkan seksi setengah jadi.
 */
export function localizeLanding(
  landing: ProductLanding,
  locale: Locale,
): LocalizedProductLanding {
  const result: Record<string, unknown> = {};

  for (const spec of LANDING_SLOTS) {
    const section = landing[spec.slot];
    if (!section) continue;

    const localized = localizeValue(section, locale) as {
      heading: string;
      intro: string;
      items: Record<string, unknown>[];
    };

    const items = localized.items.filter((item) => hasContent(spec, item));
    if (localized.heading.trim() === "" || items.length === 0) continue;

    result[spec.slot] = { ...localized, items };
  }

  return result as LocalizedProductLanding;
}

/** Benar kalau tidak ada satu pun seksi yang layak tayang. */
export function isLandingEmpty(landing: LocalizedProductLanding): boolean {
  return Object.keys(landing).length === 0;
}
