import { z } from "zod";

/**
 * Halaman jualan produk digital: daftar blok berurutan, disimpan sebagai satu
 * kolom `jsonb` di `DigitalProduct.blocks`.
 *
 * **Daftar blok, bukan template tetap.** Pendahulunya (`product-landing.ts`)
 * punya delapan seksi bernama yang urutannya dikunci kode. Itu menjamin halaman
 * selalu tersusun masuk akal, tapi juga berarti produk sederhana tidak bisa
 * terbit tanpa mengarang isi seksi yang tidak dipunyainya. Sekarang pemilik
 * menambah blok yang ia butuhkan, dalam urutan yang ia mau — dan yang esensial
 * (sampul, harga, "apa yang kamu dapat") sudah pindah ke kolom sendiri, jadi
 * produk dengan nol blok tetap punya halaman yang lengkap.
 *
 * **Rupa tetap milik kode.** Yang disimpan cuma makna: jenis blok, judul,
 * pengantar, dan itemnya. Urutan tampil adalah urutan larik; nada latar
 * dihitung dari indeks blok saat render dan tidak pernah disimpan.
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

export const MAX_BLOCKS_PER_PRODUCT = 12;
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

export const BUCKET_PATH_PREFIX = "/storage/v1/object/public/";

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

export const linkUrlSchema = z
  .string()
  .max(500)
  .refine(isSafeLinkUrl, "Tautan harus https:// atau path yang diawali /");

export const imageUrlSchema = z
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

// --- Enam jenis blok -----------------------------------------------------
// Field kosong berarti "tidak diisi". Tidak ada `.optional()` di level field
// supaya bolak-balik FormData tidak pernah ambigu antara kosong dan hilang.

/**
 * Dicetak di penyunting sebagai uuid lalu ikut bolak-balik lewat input
 * tersembunyi. Bentuknya dikunci ke karakter yang aman untuk fragmen URL:
 * nilainya berakhir di atribut `id` blok dan di `href="#…"` jangkarnya.
 */
const blockIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "ID blok tidak valid");

const blockHead = {
  id: blockIdSchema,
  heading: localizedText(SHORT),
  intro: localizedText(MEDIUM),
};

const items = <T extends z.ZodTypeAny>(item: T) =>
  z.array(item).max(MAX_ITEMS_PER_SECTION);

export const LIST_STYLES = ["points", "cards", "specs"] as const;
export type ListStyle = (typeof LIST_STYLES)[number];

/**
 * `positioning`, `features`, dan `specs` dulunya tiga slot terpisah dengan
 * daftar field yang identik; yang membedakan cuma tata letaknya. Ketiganya
 * lebur jadi satu jenis dengan `style` — tiga penyunting dan tiga perender
 * yang nyaris kembar hilang bersamanya.
 */
const listBlock = z.object({
  ...blockHead,
  kind: z.literal("list"),
  style: z.enum(LIST_STYLES).default("points"),
  items: items(
    z.object({ label: localizedText(SHORT), detail: localizedText(MEDIUM) }),
  ),
});

const comparisonBlock = z.object({
  ...blockHead,
  kind: z.literal("comparison"),
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

const variantsBlock = z.object({
  ...blockHead,
  kind: z.literal("variants"),
  items: items(
    z.object({
      name: localizedText(SHORT),
      /**
       * Boleh kosong. Dulu wajib berformat `#1f4433`, yang memaksa varian
       * yang sebenarnya bukan warna (format berkas, ukuran) mengarang satu.
       * Kosong berarti kotak warnanya tidak dirender sama sekali.
       */
      hex: z
        .string()
        .refine(
          (value) => value === "" || /^#[0-9a-fA-F]{6}$/.test(value),
          "Warna berformat #1f4433, atau kosongkan",
        ),
      description: localizedText(MEDIUM),
      image: imageUrlSchema,
      // Kosong berarti demo untuk varian ini belum ada — tombolnya tidak
      // dirender sama sekali, bukan dirender sebagai tautan mati.
      linkUrl: linkUrlSchema,
    }),
  ),
});

const tiersBlock = z.object({
  ...blockHead,
  kind: z.literal("tiers"),
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

const faqBlock = z.object({
  ...blockHead,
  kind: z.literal("faq"),
  items: items(
    z.object({ question: localizedText(SHORT), answer: localizedText(LONG) }),
  ),
});

const galleryBlock = z.object({
  ...blockHead,
  kind: z.literal("gallery"),
  items: items(
    z.object({ image: imageUrlSchema, caption: localizedText(SHORT) }),
  ),
});

export const blockSchema = z.discriminatedUnion("kind", [
  listBlock,
  comparisonBlock,
  variantsBlock,
  tiersBlock,
  faqBlock,
  galleryBlock,
]);

export const productBlocksSchema = z
  .array(blockSchema)
  .max(MAX_BLOCKS_PER_PRODUCT);

export type Block = z.infer<typeof blockSchema>;
export type ProductBlocks = z.infer<typeof productBlocksSchema>;
export type BlockKind = Block["kind"];

// --- Tabel deskriptor ----------------------------------------------------
/**
 * Satu sumber kebenaran untuk label form dan daftar field tiap jenis blok.
 *
 * Ini kontrak, bukan detail penyunting. Empat pihak berjalan di atasnya —
 * `blocksFromForm()`, `uploadBlockImages()`, `blockImageUrls()`, dan penyunting
 * blok — dan tanpa tabel ini keenam jenis akan tumbuh jadi enam percabangan
 * tulis tangan di empat berkas berbeda, persis duplikasi yang dihapus rombakan
 * ini. Menambah field berarti menyunting satu tabel.
 */

export type BlockFieldKind =
  "text" | "textarea" | "lines" | "image" | "url" | "color" | "flag";

export type BlockFieldSpec = {
  name: string;
  label: string;
  kind: BlockFieldKind;
  /** Dirender sebagai sepasang input EN/ID dan disimpan sebagai `{en, id}`. */
  localized: boolean;
  hint?: string;
};

export type BlockKindSpec = {
  kind: BlockKind;
  /** Ditampilkan di menu "tambah blok". */
  label: string;
  hint: string;
  itemLabel: string;
  /** Hanya `list`: pilihan tata letak yang tersedia. */
  styles?: readonly ListStyle[];
  /** Item dianggap kosong kalau semua field ini kosong di bahasa itu. */
  requires: string[];
  fields: BlockFieldSpec[];
};

const listFields: BlockFieldSpec[] = [
  { name: "label", label: "Label", kind: "text", localized: true },
  { name: "detail", label: "Penjelasan", kind: "textarea", localized: true },
];

export const BLOCK_KIND_SPECS: Record<BlockKind, BlockKindSpec> = {
  list: {
    kind: "list",
    label: "Daftar poin",
    hint:
      "Satu bentuk data, tiga tata letak: poin bernomor, kisi kartu, atau " +
      "tabel label/nilai. Dipakai untuk posisi produk, fitur, dan syarat.",
    itemLabel: "Poin",
    styles: LIST_STYLES,
    requires: ["label", "detail"],
    fields: listFields,
  },
  comparison: {
    kind: "comparison",
    label: "Perbandingan",
    hint:
      "Perbandingan sebelum/sesudah, ditampilkan sebagai pembagi yang bisa digeser. " +
      "Pakai sepasang gambar berasio sama — kotaknya mengikuti bentuk gambar " +
      '"sebelum", jadi pasangan yang berbeda rasio akan terlihat terpotong saat disapu. ' +
      "Item tanpa gambar dirender sebagai teks saja.",
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
  variants: {
    kind: "variants",
    label: "Varian",
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
        hint: "Format #1f4433. Kosongkan bila varian ini bukan soal warna.",
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
  tiers: {
    kind: "tiers",
    label: "Paket",
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
  faq: {
    kind: "faq",
    label: "Tanya jawab",
    hint: "Jawaban mendukung Markdown, jadi boleh memuat tautan.",
    itemLabel: "Butir",
    requires: ["question"],
    fields: [
      { name: "question", label: "Pertanyaan", kind: "text", localized: true },
      { name: "answer", label: "Jawaban", kind: "textarea", localized: true },
    ],
  },
  gallery: {
    kind: "gallery",
    label: "Galeri",
    hint: "Tangkapan layar berketerangan.",
    itemLabel: "Gambar",
    requires: ["image"],
    fields: [
      { name: "image", label: "Gambar", kind: "image", localized: false },
      { name: "caption", label: "Keterangan", kind: "text", localized: true },
    ],
  },
};

/** Urutan tetap untuk menu "tambah blok". */
export const BLOCK_KINDS = Object.keys(BLOCK_KIND_SPECS) as BlockKind[];

/** Semua URL gambar di dalam blok — dipakai saat menghapus produk. */
export function blockImageUrls(blocks: ProductBlocks): string[] {
  const urls: string[] = [];
  for (const block of blocks) {
    const imageFields = BLOCK_KIND_SPECS[block.kind].fields.filter(
      (field) => field.kind === "image",
    );
    if (imageFields.length === 0) continue;
    for (const item of block.items as Record<string, unknown>[]) {
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

export type LocalizedBlock = Localize<Block>;
/** Satu jenis blok yang sudah dilokalkan, mis. `LocalizedBlockOf<"tiers">`. */
export type LocalizedBlockOf<K extends BlockKind> = Extract<
  LocalizedBlock,
  { kind: K }
>;

function localizeValue(value: unknown, locale: Locale): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => localizeValue(entry, locale));
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    // Satu-satunya objek berkunci tepat {en, id} di skema ini adalah teks
    // dwibahasa — tidak ada blok atau item yang berbentuk begitu.
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

function hasContent(spec: BlockKindSpec, item: Record<string, unknown>) {
  return spec.requires.some((name) => {
    const value = item[name];
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === "string" && value.trim() !== "";
  });
}

/**
 * Membuang blok yang tidak layak tayang di bahasa ini: judulnya kosong, atau
 * tidak menyisakan satu pun item yang terisi. Produk yang hanya diterjemahkan
 * sebagian karena itu tidak pernah menampilkan blok setengah jadi.
 *
 * Urutan larik dipertahankan apa adanya — itulah urutan yang dipilih pemilik.
 */
export function localizeBlocks(
  blocks: ProductBlocks,
  locale: Locale,
): LocalizedBlock[] {
  const result: LocalizedBlock[] = [];

  for (const block of blocks) {
    const spec = BLOCK_KIND_SPECS[block.kind];
    const localized = localizeValue(block, locale) as {
      heading: string;
      items: Record<string, unknown>[];
    };

    const items = localized.items.filter((item) => hasContent(spec, item));
    if (localized.heading.trim() === "" || items.length === 0) continue;

    result.push({ ...localized, items } as LocalizedBlock);
  }

  return result;
}
