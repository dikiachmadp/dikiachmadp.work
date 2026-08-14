import "server-only";
import { createClient } from "@/lib/supabase/server";
import { MAX_FILE_BYTES } from "@/lib/upload-limits";

const BUCKET = "project-images";

/**
 * Bucket ini publik. Apa pun yang masuk bisa diambil siapa saja lewat CDN
 * dengan `content-type` yang ikut tersimpan — jadi berkas HTML atau SVG akan
 * dieksekusi browser sebagai halaman di domain `*.supabase.co`. Karena itu
 * tipe dibatasi ke raster image saja, dan ekstensinya diturunkan dari tipe,
 * bukan dari nama berkas yang dikirim klien.
 */
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

// Batasnya dipakai bersama form admin supaya klien dan server tidak berselisih.
const MAX_BYTES = MAX_FILE_BYTES;

const readableTypes = Object.keys(ALLOWED_TYPES).join(", ");

// Upload gambar ke Supabase Storage (butuh sesi user login — policy bucket
// hanya mengizinkan insert untuk role authenticated). Mengembalikan URL publik.
export async function uploadProjectImage(
  file: File,
  slug: string,
): Promise<string> {
  const contentType = file.type.toLowerCase();
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) {
    throw new Error(
      `Tipe berkas "${file.type || "tidak diketahui"}" tidak didukung. Gunakan ${readableTypes}.`,
    );
  }
  if (file.size > MAX_BYTES) {
    throw new Error(
      `Ukuran gambar maksimal ${MAX_BYTES / 1024 / 1024} MB (berkas ini ${(
        file.size /
        1024 /
        1024
      ).toFixed(1)} MB).`,
    );
  }

  const supabase = await createClient();
  // slug sudah divalidasi `^[a-z0-9-]+$` di projectFormSchema, dan ekstensinya
  // dari tabel di atas — jadi tidak ada bagian path yang berasal dari klien.
  const path = `${slug}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType,
  });
  if (error) {
    throw new Error(`Gagal mengunggah gambar: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

/**
 * Ubah URL publik menjadi path di dalam bucket. URL yang bukan milik bucket ini
 * (gambar lama yang di-host dari /public, atau tautan eksternal) dilewati.
 */
export function bucketPathFromUrl(url: string): string | null {
  const index = url.indexOf(PUBLIC_PREFIX);
  if (index === -1) return null;
  const path = url.slice(index + PUBLIC_PREFIX.length);
  return path ? decodeURIComponent(path) : null;
}

/**
 * Hapus gambar milik sebuah project. Tanpa ini menghapus project meninggalkan
 * berkas yatim yang tetap bisa diakses publik selamanya.
 */
export async function removeProjectImages(urls: string[]): Promise<void> {
  const paths = urls
    .map(bucketPathFromUrl)
    .filter((path): path is string => path !== null);
  if (paths.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) {
    // Project-nya sudah terhapus; berkas yatim bukan alasan menggagalkan aksi.
    console.error("Gagal menghapus gambar project:", error.message);
  }
}
