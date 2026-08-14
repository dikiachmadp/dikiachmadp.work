/**
 * Menyisipkan satu blok JSON-LD.
 *
 * `JSON.stringify` tidak meng-escape `<`, jadi string yang memuat `</script>`
 * bisa keluar dari tag dan menjadi XSS. Judul, deskripsi, dan nama klien datang
 * dari database, jadi `<` diganti padanan unicode-nya sesuai panduan JSON-LD
 * Next (`01-app/02-guides/json-ld.md`).
 *
 * Ini script inline, dan CSP situs ini memang masih mengizinkannya
 * (`script-src 'self' 'unsafe-inline'` — lihat docs/operations.md). Kalau suatu
 * saat nonce dipasang, blok ini ikut membutuhkannya.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
