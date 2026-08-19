import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Markdown from "@/components/logbook/Markdown";

const render = (markdown: string): string =>
  renderToStaticMarkup(<Markdown>{markdown}</Markdown>);

/**
 * Isi tulisan datang dari form admin dan disimpan mentah sebagai Markdown.
 * Yang menutup XSS di sini bukan sanitizer, melainkan ketiadaan `rehype-raw`:
 * react-markdown merender ke elemen React, jadi HTML mentah di dalam Markdown
 * tidak pernah jadi HTML. Test ini yang menjaga keputusan itu tidak dibatalkan
 * diam-diam oleh "biar bisa pakai sedikit HTML".
 */
describe("keamanan renderer Markdown", () => {
  it("does not turn a raw <script> tag into a script element", () => {
    const html = render("Sebelum\n\n<script>alert(1)</script>\n\nSesudah");

    expect(html).not.toContain("<script");
    expect(html).toContain("Sesudah");
  });

  // HTML mentah keluar sebagai teks yang di-escape, bukan sebagai elemen: tidak
  // ada `<img>`, jadi `onerror` tidak pernah jadi atribut yang bisa dijalankan.
  it("renders raw HTML with an event handler as escaped text", () => {
    const html = render('<img src="x" onerror="alert(1)">');

    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("strips a javascript: href", () => {
    const html = render("[klik](javascript:alert(1))");

    expect(html).not.toContain("javascript:");
    expect(html).toContain("klik");
  });

  it("keeps ordinary links", () => {
    const html = render("[situs](https://example.com)");

    expect(html).toContain('href="https://example.com"');
  });

  // Tautan yang membuka tab baru tanpa rel memberi halaman tujuan akses ke
  // `window.opener`.
  it("gives outbound links rel=noopener noreferrer", () => {
    const html = render("[situs](https://example.com)");

    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  it("leaves internal links in the same tab", () => {
    const html = render("[proyek](/en/projects)");

    expect(html).not.toContain('target="_blank"');
  });
});

describe("pemetaan Markdown ke gaya situs", () => {
  it("renders GFM tables", () => {
    const html = render("| a | b |\n| - | - |\n| 1 | 2 |");

    expect(html).toContain("<table");
    expect(html).toContain("<th");
  });

  /**
   * Aturan yang berlaku di seluruh repo: konten lebar menggulir di dalam
   * kotaknya sendiri, body tidak pernah menggulir horizontal. Tabel dan blok
   * kode adalah dua hal yang paling mudah melanggarnya.
   */
  it("wraps tables in their own horizontal scroller", () => {
    const html = render("| a | b |\n| - | - |\n| 1 | 2 |");

    expect(html).toMatch(/<div[^>]*overflow-x-auto[^>]*>\s*<table/);
  });

  it("gives code blocks their own scroller too", () => {
    const html = render("```\nsatu baris yang sangat panjang\n```");

    expect(html).toMatch(/<pre[^>]*overflow-x-auto/);
  });

  it("uses the site's display face for headings", () => {
    expect(render("## Judul")).toContain("font-hand");
  });

  it("supports GFM strikethrough", () => {
    expect(render("~~dicoret~~")).toContain("<del>");
  });

  // Badan tulisan tetap rata kanan-kiri di semua lebar layar — beda dari
  // `.m-justify` yang dipakai di tempat lain di situs (cuma <640px), badan
  // Logbook/produk dianggap bacaan panjang yang lebih enak dibaca rata
  // di kedua sisi bahkan di desktop.
  it("keeps every paragraph justified regardless of viewport width", () => {
    const html = render("Paragraf pertama.\n\nParagraf kedua.");

    expect(html.match(/class="justify-body /g)).toHaveLength(2);
  });

  it("renders a Markdown image with a caption from its alt text", () => {
    const html = render("![Sebuah tangkapan layar](https://example.com/a.png)");

    expect(html).toContain('src="https://example.com/a.png"');
    expect(html).toContain("<figcaption");
    expect(html).toContain("Sebuah tangkapan layar");
  });

  it("skips the caption when the image has no alt text", () => {
    const html = render("![](https://example.com/a.png)");

    expect(html).not.toContain("<figcaption");
  });

  it("gives the blockquote a decorative opening quote mark", () => {
    const html = render("> Kata-kata bijak.");

    expect(html).toContain("aria-hidden");
    expect(html).toContain("“");
  });
});
