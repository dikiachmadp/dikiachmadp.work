import "server-only";
import { getDictionary } from "@/lib/dictionary";

/**
 * Label kategori tetap tinggal di JSON (bagian dari copy UI), tapi form admin
 * butuh keduanya sekaligus: chip publik memfilter dengan perbandingan string
 * persis, jadi kategori harus dipilih dari daftar ini, bukan diketik bebas.
 */
export async function getCategoryLabels(): Promise<
  Record<"en" | "id", string[]>
> {
  const [en, id] = await Promise.all([getDictionary("en"), getDictionary("id")]);
  const strip = (labels: string[]) =>
    labels.filter((label) => label.toLowerCase() !== "all" && label !== "Semua");

  return {
    en: strip(en.projects.categories),
    id: strip(id.projects.categories),
  };
}
