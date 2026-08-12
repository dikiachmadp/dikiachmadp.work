import "server-only";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "project-images";

// Upload gambar ke Supabase Storage (butuh sesi user login — policy bucket
// hanya mengizinkan insert untuk role authenticated). Mengembalikan URL publik.
export async function uploadProjectImage(
  file: File,
  slug: string,
): Promise<string> {
  const supabase = await createClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "webp";
  const path = `${slug}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
  });
  if (error) {
    throw new Error(`Gagal mengunggah gambar: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
