import "server-only";
import { revalidatePath } from "next/cache";

const locales = ["en", "id"] as const;

// Panggil dari server action admin setelah mutasi project/testimonial agar
// halaman publik yang statis langsung menampilkan data terbaru.
export function revalidateProjectPaths(slug?: string) {
  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/projects`);
    if (slug) {
      revalidatePath(`/${locale}/projects/${slug}`);
    }
  }
  // Tanpa ini project baru tidak masuk sitemap sampai deploy berikutnya.
  revalidatePath("/sitemap.xml");
}

/**
 * Slug Logbook berbeda per bahasa, jadi yang direvalidasi adalah pasangan
 * `{locale, slug}` — bukan satu slug untuk semua bahasa.
 *
 * `previous` wajib diperhitungkan: kalau hanya slug baru yang direvalidasi,
 * URL lama tetap tersaji dari cache sampai ISR kedaluwarsa, dan pos yang
 * dihapus tetap hidup di alamatnya yang lama. Itu persis dua celah yang
 * tertinggal di `revalidateProjectPaths`.
 */
export function revalidateLogbookPaths({
  slugs = [],
  previousSlugs = [],
}: {
  slugs?: { locale: string; slug: string }[];
  previousSlugs?: { locale: string; slug: string }[];
} = {}) {
  for (const locale of locales) {
    // Homepage menampilkan 3 pos terbaru, dan kartu di Studio ikut berubah
    // setiap ada pos baru — keduanya basi tanpa ini, bukan cuma dua index-nya.
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/studio`);
    revalidatePath(`/${locale}/logbook`);
  }

  const seen = new Set<string>();
  for (const { locale, slug } of [...slugs, ...previousSlugs]) {
    const path = `/${locale}/logbook/${slug}`;
    if (seen.has(path)) continue;
    seen.add(path);
    revalidatePath(path);
  }

  revalidatePath("/sitemap.xml");
}

// About tidak punya slug atau draft — satu halaman publik per locale, jadi
// tidak ada pasangan lama/baru untuk dipertimbangkan seperti di Logbook.
export function revalidateAboutPaths() {
  for (const locale of locales) {
    revalidatePath(`/${locale}/about`);
  }
}
