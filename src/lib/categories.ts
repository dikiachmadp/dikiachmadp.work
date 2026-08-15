import enProjects from "@/content/en/projects.json";
import idProjects from "@/content/id/projects.json";
import type { Locale, ProjectCategory } from "@/types/content";

/**
 * Kategori project: kunci stabil dari JSON, label per bahasa.
 *
 * Tidak `server-only`, mengikuti pola `ui-dictionary.ts` — chip filter dan
 * kartu project adalah Client Component, dan keduanya butuh label ini.
 * Ongkos bundelnya nol tambahan: kedua berkas sudah ikut terbawa lewat
 * dictionary.
 *
 * Yang dibandingkan filter adalah `key`, tidak pernah `label`. Itu bedanya
 * dengan versi lama, yang menyamakan label chip dengan label kategori project
 * dan karena itu ambruk begitu salah satunya diterjemahkan.
 */
export function projectCategories(locale: Locale): ProjectCategory[] {
  return (locale === "id" ? idProjects : enProjects).categories;
}

/**
 * Label untuk sebuah kunci kategori.
 *
 * Kunci yang tidak ada di daftar dikembalikan apa adanya, bukan jadi string
 * kosong: `web-design` yang terlihat di kartu adalah bug yang bisa dilacak,
 * kartu tanpa kategori tidak. Ini bisa terjadi kalau sebuah project di database
 * memakai kunci yang kemudian dihapus dari JSON.
 */
export function categoryLabel(locale: Locale, key: string): string {
  return projectCategories(locale).find((c) => c.key === key)?.label ?? key;
}
