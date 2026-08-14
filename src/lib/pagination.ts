/**
 * `?page=` datang dari URL, jadi bentuknya tidak dijamin: bisa hilang, ganda
 * (`?page=2&page=9`), berupa teks, pecahan, nol, atau negatif. Semua itu
 * berakhir di `skip` Prisma kalau diteruskan mentah — `skip` negatif melempar,
 * dan pecahan menghasilkan offset yang tidak masuk akal.
 */
export function parsePageParam(
  raw: string | string[] | undefined | null,
): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 1 ? parsed : 1;
}

/**
 * Query `?page=` untuk redirect setelah mutasi, kosong kalau halaman 1.
 *
 * Nilainya dilewatkan parsePageParam dulu, jadi apa pun yang dikirim klien
 * lewat field tersembunyi keluar sebagai bilangan bulat — tidak ada teks mentah
 * yang menempel di URL redirect.
 */
export function pageQuery(raw: FormDataEntryValue | null): string {
  const page = parsePageParam(typeof raw === "string" ? raw : null);
  return page > 1 ? `?page=${page}` : "";
}

/** Jumlah halaman dari total baris. Selalu minimal 1, termasuk saat kosong. */
export function pageCount(total: number, perPage: number): number {
  if (perPage < 1) return 1;
  return Math.max(1, Math.ceil(total / perPage));
}

/**
 * Nomor halaman yang ditampilkan: selalu halaman pertama dan terakhir, plus
 * tetangga halaman aktif. `null` menandai jeda (elipsis).
 *
 * Tanpa jendela ini, kotak masuk yang menumpuk ratusan pesan merender deretan
 * tautan sepanjang layar.
 */
export function pageWindow(current: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const neighbours = [current - 1, current, current + 1].filter(
    (n) => n > 1 && n < pages,
  );

  const out: (number | null)[] = [];
  for (const n of [1, ...neighbours, pages]) {
    const last = out[out.length - 1];
    if (typeof last === "number" && n - last > 1) out.push(null);
    out.push(n);
  }
  return out;
}
