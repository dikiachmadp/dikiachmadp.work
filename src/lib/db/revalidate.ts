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
