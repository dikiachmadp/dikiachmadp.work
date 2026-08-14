/**
 * Batas ukuran unggahan gambar project.
 *
 * Ada dua batas berbeda dan keduanya harus ada:
 *
 * - `MAX_FILE_BYTES` — per berkas, ditegakkan di server oleh
 *   `uploadProjectImage()`. Ini yang menjaga Storage.
 * - `MAX_TOTAL_BYTES` — untuk seluruh isi form sekaligus. Satu submit bisa
 *   membawa cover + logo + banyak gambar galeri, jadi total bisa jauh melebihi
 *   batas per berkas meski setiap berkasnya sah.
 *
 * `MAX_TOTAL_BYTES` mencerminkan `serverActions.bodySizeLimit` di
 * next.config.ts. Kalau body melampauinya, Next menolak request sebelum server
 * action sempat berjalan — tanpa pesan yang bisa dibaca admin. Karena itu form
 * memeriksanya lebih dulu di klien.
 *
 * Angkanya sedikit di bawah 8 MB: batas Next berlaku pada body HTTP mentah,
 * termasuk boundary dan header multipart, yang menambah beberapa puluh KB.
 */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;

export const MAX_TOTAL_BYTES = 7.5 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Total ukuran semua berkas yang dipilih di sebuah form. */
export function totalFileBytes(files: Iterable<File>): number {
  let total = 0;
  for (const file of files) total += file.size;
  return total;
}

/**
 * Pesan kalau pilihan berkas tidak akan lolos, atau null kalau aman.
 *
 * Berkas per-satuan diperiksa lebih dulu supaya admin tahu berkas mana yang
 * bermasalah, bukan sekadar "totalnya kebesaran".
 */
export function uploadRejectionReason(files: File[]): string | null {
  const tooBig = files.find((file) => file.size > MAX_FILE_BYTES);
  if (tooBig) {
    return `"${tooBig.name}" berukuran ${formatBytes(tooBig.size)}. Maksimal ${formatBytes(MAX_FILE_BYTES)} per gambar.`;
  }

  const total = totalFileBytes(files);
  if (total > MAX_TOTAL_BYTES) {
    return `Total unggahan ${formatBytes(total)}, melebihi batas ${formatBytes(MAX_TOTAL_BYTES)} sekali kirim. Unggah galeri dalam beberapa tahap.`;
  }

  return null;
}
