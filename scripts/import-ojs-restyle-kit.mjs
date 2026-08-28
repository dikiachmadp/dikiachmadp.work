/**
 * Impor sekali jalan: OJS Restyle Kit 3.3 dari materi promosi ke database.
 *
 * Skrip ini **sementara**. Nilainya pindah ke database dan ke form admin
 * begitu impor terverifikasi; setelah itu berkas ini dihapus. Produk
 * berikutnya diisi lewat /dashboard/products, bukan lewat skrip.
 *
 * Jalankan:
 *   node --env-file=.env --env-file=.env.local scripts/import-ojs-restyle-kit.mjs
 *
 * Butuh SUPABASE_SERVICE_ROLE_KEY di .env: kebijakan bucket hanya mengizinkan
 * insert untuk peran `authenticated` (lihat docs/storage.sql) dan skrip tidak
 * punya sesi login. Ambil dari Supabase Dashboard > Settings > API, lalu hapus
 * barisnya setelah impor selesai.
 *
 * Idempoten: gambar diunggah dengan nama tetap (upsert) dan produknya
 * dicocokkan lewat slug, jadi menjalankan ulang memperbarui, bukan menggandakan.
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const PROMO = "/Users/kid/Website/Digital Product/_promo";
const SLUG = "ojs-restyle-kit-3-3";
const BUCKET = "project-images";
const PREFIX = `products/${SLUG}`;

// Tautan checkout permanen dari Polar (GET /v1/checkout-links/), bukan URL
// etalase yang bisa berubah kalau produknya diganti nama.
const CHECKOUT = {
  gratis:
    "https://buy.polar.sh/polar_cl_x3TMcCJ1Cr9D73RkEiwq41gZkFy4CwZzRL1PV3AOLmF",
  lengkap:
    "https://buy.polar.sh/polar_cl_aRuULKQyfEr7LFjJ67hv5DUc4BQUJY6TmKKCJ0Sc43k",
};

function need(name) {
  const value = process.env[name];
  if (!value) {
    console.error(
      `\n${name} belum diisi di .env — lihat komentar di kepala berkas ini.\n`,
    );
    process.exit(1);
  }
  return value;
}

/** Pasangan teks dwibahasa, bentuk yang dipakai ProductLandingSchema. */
const t = (en, id) => ({ en, id });

// --- Unggah gambar --------------------------------------------------------

async function uploadImages(supabaseUrl, serviceKey) {
  const dir = path.join(PROMO, "gambar");
  const files = (await readdir(dir)).filter((name) => name.endsWith(".webp"));
  const urls = new Map();

  for (const name of files) {
    const body = await readFile(path.join(dir, name));
    const target = `${PREFIX}/${name}`;
    const response = await fetch(
      `${supabaseUrl}/storage/v1/object/${BUCKET}/${target}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "image/webp",
          // Nama berkasnya tetap, jadi menjalankan ulang menimpa, bukan
          // menumpuk salinan yatim di bucket.
          "x-upsert": "true",
        },
        body,
      },
    );
    if (!response.ok) {
      throw new Error(
        `Gagal mengunggah ${name}: ${response.status} ${await response.text()}`,
      );
    }
    urls.set(
      `/images/produk/${name}`,
      `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${target}`,
    );
    process.stdout.write(".");
  }

  console.log(` ${files.length} gambar terunggah`);
  return urls;
}

// --- Susun landing --------------------------------------------------------

function buildLanding(id, en, urls) {
  const img = (promoPath) => {
    if (!promoPath) return "";
    const url = urls.get(promoPath);
    if (!url) throw new Error(`Gambar tidak dikenal: ${promoPath}`);
    return url;
  };

  const pair = (get) => t(get(en), get(id));

  // Satu-satunya slot perbandingan menampung tiga kelompok materi promosi:
  // perbandingan desktop, layar ponsel, dan lima cacat tema bawaan. Judul
  // seksinya karena itu ditulis sebagai payung — materi aslinya tidak punya
  // satu judul yang mencakup ketiganya.
  const proofItems = [
    {
      title: pair((d) => d.desktopComparison.heading),
      detail: pair((d) => d.desktopComparison.intro),
      beforeImage: img(id.desktopComparison.comparison.beforeImage),
      beforeLabel: pair((d) => d.desktopComparison.comparison.beforeLabel),
      afterImage: img(id.desktopComparison.comparison.afterImage),
      afterLabel: pair((d) => d.desktopComparison.comparison.afterLabel),
    },
    {
      title: pair((d) => d.mobile.heading),
      detail: pair((d) => `${d.mobile.problem}\n\n${d.mobile.solution}`),
      beforeImage: img(id.mobile.comparison.beforeImage),
      beforeLabel: pair((d) => d.mobile.comparison.beforeLabel),
      afterImage: img(id.mobile.comparison.afterImage),
      afterLabel: pair((d) => d.mobile.comparison.afterLabel),
    },
    ...id.fixes.items.map((item, i) => ({
      title: t(en.fixes.items[i].title, item.title),
      detail: t(en.fixes.items[i].detail, item.detail),
      beforeImage: img(item.beforeImage),
      beforeLabel: t("Before", "Sebelum"),
      afterImage: img(item.afterImage),
      afterLabel: t("After", "Sesudah"),
    })),
  ];

  // Dua butir tambahan yang tidak ada di materi promosi. Keduanya menjawab
  // keberatan nyata pembeli institusi Indonesia: Polar hanya menerima kartu,
  // dan invoice datang dari Polar sebagai merchant of record.
  const extraFaq = [
    {
      question: t(
        "Do I get a payment receipt?",
        "Apakah saya mendapat bukti pembayaran?",
      ),
      answer: t(
        "Yes. Polar acts as the merchant of record and issues a tax-correct PDF invoice for every paid order. You can download it yourself from the link in your order confirmation email.",
        "Ya. Polar bertindak sebagai merchant of record dan menerbitkan invoice PDF yang sah secara pajak untuk setiap pesanan berbayar. Anda dapat mengunduhnya sendiri melalui tautan pada surel konfirmasi pesanan.",
      ),
    },
    {
      question: t(
        "Which payment methods are accepted?",
        "Metode pembayaran apa saja yang diterima?",
      ),
      answer: t(
        "Credit and debit cards, as well as Apple Pay and Google Pay, which are themselves backed by a card. QRIS, bank transfer, and virtual accounts are not available. Apabila lembaga Anda harus membayar melalui transfer, silakan [hubungi saya](/en/contact) untuk pengaturan tersendiri.",
        "Kartu kredit dan kartu debit, serta Apple Pay dan Google Pay yang keduanya tetap bersandar pada kartu. QRIS, transfer bank, dan virtual account belum tersedia. Apabila lembaga Anda harus membayar melalui transfer, silakan [hubungi saya](/id/contact) untuk pengaturan tersendiri.",
      ),
    },
  ];

  return {
    positioning: {
      heading: pair((d) => d.notATheme.heading),
      intro: pair((d) => d.notATheme.body),
      items: id.notATheme.points.map((point, i) => ({
        label: t(en.notATheme.points[i].label, point.label),
        detail: t(en.notATheme.points[i].detail, point.detail),
      })),
    },

    proof: {
      heading: t("Before and after", "Perbandingan sebelum dan sesudah"),
      // Hanya intro `fixes`: intro `desktopComparison` sudah menjadi detail
      // item pertama, dan menggabungkan keduanya membuat kalimat yang sama
      // muncul dua kali beruntun di layar.
      intro: pair((d) => d.fixes.intro),
      items: proofItems,
    },

    features: {
      heading: t("What you get", "Apa yang Anda dapatkan"),
      intro: t("", ""),
      items: id.features.map((feature, i) => ({
        label: t(en.features[i].title, feature.title),
        detail: t(en.features[i].detail, feature.detail),
      })),
    },

    variants: {
      // Materi promosi berbunyi "Lima warna, lima demo langsung", padahal
      // kelima demoUrl masih kosong sehingga tidak ada tombol demo yang
      // dirender. Teksnya dinetralkan supaya halaman tidak menjanjikan sesuatu
      // yang belum ada; kembalikan lewat dasbor begitu demonya hidup.
      heading: t("Five ready-to-upload colours", "Lima warna siap unggah"),
      intro: t(
        "Each colour is a complete CSS file, ready to upload — not a single line needs editing.",
        "Setiap warna berupa satu berkas CSS utuh yang tinggal diunggah — tidak ada satu baris pun yang perlu disunting.",
      ),
      items: id.colors.items.map((colour, i) => ({
        name: t(en.colors.items[i].name, colour.name),
        hex: colour.hex,
        description: t(en.colors.items[i].description, colour.description),
        image: img(colour.image),
        // Kosong sampai jurnal demo dipasang; tombolnya tidak dirender.
        linkUrl: colour.demoUrl || "",
      })),
    },

    tiers: {
      heading: pair((d) => d.tiers.heading),
      intro: t("", ""),
      items: id.tiers.items.map((tier, i) => {
        const other = en.tiers.items[i];
        return {
          name: t(other.name, tier.name),
          price: t(other.price, tier.price),
          priceNote: t(other.priceNote, tier.priceNote),
          summary: t(other.summary, tier.summary),
          includes: { en: other.includes, id: tier.includes },
          excludes: { en: other.excludes, id: tier.excludes },
          ctaLabel: t(other.cta, tier.cta),
          ctaUrl: CHECKOUT[tier.id] ?? "",
          recommended: tier.recommended === true,
        };
      }),
    },

    specs: {
      heading: pair((d) => d.requirements.heading),
      intro: t("", ""),
      items: id.requirements.items.map((spec, i) => ({
        label: t(en.requirements.items[i].label, spec.label),
        detail: t(en.requirements.items[i].value, spec.value),
      })),
    },

    faq: {
      heading: t("Questions and answers", "Tanya jawab"),
      intro: t("", ""),
      items: [
        ...id.faq.map((entry, i) => ({
          question: t(en.faq[i].q, entry.q),
          answer: t(en.faq[i].a, entry.a),
        })),
        ...extraFaq,
      ],
    },

    gallery: {
      heading: t("Screenshots", "Tangkapan layar"),
      intro: t("", ""),
      items: [
        ...id.gallery.map((entry, i) => ({
          image: img(entry.image),
          caption: t(en.gallery[i].caption, entry.caption),
        })),
        ...id.mobile.gallery.map((image) => ({
          image: img(image),
          caption: t("On a phone", "Tampilan di ponsel"),
        })),
      ],
    },
  };
}

// --- Tulis ke database ----------------------------------------------------

async function write(client, { id, en, landing, coverImage }) {
  // Idempoten lewat slug: `DigitalProduct` sendiri tidak punya kolom unik yang
  // bisa dipakai `on conflict`, jadi keberadaannya dicari lewat terjemahan.
  const found = await client.query(
    `select "productId" from "DigitalProductTranslation" where slug = $1 limit 1`,
    [SLUG],
  );

  const values = [
    "149000",
    "IDR",
    CHECKOUT.lengkap,
    coverImage,
    ["OJS", "CSS", "Jurnal"],
    JSON.stringify(landing),
  ];

  const productId = found.rows[0]?.productId
    ? (
        await client.query(
          `update "DigitalProduct"
              set status = 'PUBLISHED', featured = true, price = $2,
                  currency = $3, "buyUrl" = $4, "coverImage" = $5, tags = $6,
                  landing = $7, "updatedAt" = now()
            where id = $1
        returning id`,
          [found.rows[0].productId, ...values],
        )
      ).rows[0].id
    : (
        await client.query(
          `insert into "DigitalProduct"
             (id, status, "publishedAt", featured, "order", price, currency,
              "buyUrl", "coverImage", gallery, tags, landing, "updatedAt")
           values (gen_random_uuid(), 'PUBLISHED', now(), true, 0, $1, $2,
                   $3, $4, '{}', $5, $6, now())
        returning id`,
          values,
        )
      ).rows[0].id;

  for (const [locale, source] of [
    ["en", en],
    ["id", id],
  ]) {
    await client.query(
      `insert into "DigitalProductTranslation"
         (id, "productId", locale, slug, title, summary, body)
       values (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
       on conflict ("productId", locale)
       do update set slug = excluded.slug, title = excluded.title,
                     summary = excluded.summary, body = excluded.body`,
      [productId, locale, SLUG, source.title, source.summary, source.tagline],
    );
  }

  return productId;
}

// --- Jalan ----------------------------------------------------------------

const id = JSON.parse(
  await readFile(path.join(PROMO, "produk.id.json"), "utf8"),
);
const en = JSON.parse(
  await readFile(path.join(PROMO, "produk.en.json"), "utf8"),
);

/**
 * `--dry-run <berkas>` menyusun landing memakai URL bucket palsu lalu
 * menuliskannya ke berkas, tanpa menyentuh Storage maupun database. Dipakai
 * untuk memeriksa bentuk datanya terhadap ProductLandingSchema sebelum impor
 * sungguhan dijalankan.
 */
if (process.argv.includes("--dry-run")) {
  const target = process.argv[process.argv.indexOf("--dry-run") + 1];
  if (!target) {
    console.error("--dry-run butuh path berkas keluaran.");
    process.exit(1);
  }
  const dir = path.join(PROMO, "gambar");
  const fake = new Map(
    (await readdir(dir))
      .filter((name) => name.endsWith(".webp"))
      .map((name) => [
        `/images/produk/${name}`,
        `https://example.supabase.co/storage/v1/object/public/${BUCKET}/${PREFIX}/${name}`,
      ]),
  );
  await writeFile(target, JSON.stringify(buildLanding(id, en, fake), null, 2));
  console.log(`Landing ditulis ke ${target} — tanpa unggah, tanpa database.`);
  process.exit(0);
}

const supabaseUrl = need("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = need("SUPABASE_SERVICE_ROLE_KEY");
const databaseUrl = need("DIRECT_URL");

const urls = await uploadImages(supabaseUrl, serviceKey);
const landing = buildLanding(id, en, urls);
const coverImage = urls.get(id.coverImage);

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  const productId = await write(client, { id, en, landing, coverImage });
  console.log(`\nProduk ${productId} tersimpan.`);
  console.log(`  http://localhost:3000/id/products/${SLUG}`);
  console.log(`  http://localhost:3000/en/products/${SLUG}`);
} finally {
  await client.end();
}
