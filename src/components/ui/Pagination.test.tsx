import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Pagination from "@/components/ui/Pagination";

const render = (props: {
  current: number;
  total: number;
  perPage?: number;
  basePath?: string;
  query?: Record<string, string>;
}) =>
  renderToStaticMarkup(
    <Pagination
      current={props.current}
      total={props.total}
      perPage={props.perPage ?? 25}
      basePath={props.basePath ?? "/id/dashboard/submissions"}
      label="Message pages"
      query={props.query}
    />,
  );

describe("Pagination", () => {
  // Halaman-halaman dasbor merendernya tanpa syarat, jadi komponen ini yang
  // memutuskan untuk menghilang saat tidak ada gunanya.
  it("renders nothing when everything fits on one page", () => {
    expect(render({ current: 1, total: 25 })).toBe("");
    expect(render({ current: 1, total: 0 })).toBe("");
  });

  it("links every page while the count is small", () => {
    const html = render({ current: 1, total: 60 });
    expect(html).toContain(">1</a>");
    expect(html).toContain(">2</a>");
    expect(html).toContain(">3</a>");
    expect(html).not.toContain("…");
  });

  // Halaman pertama tidak boleh membawa `?page=1` — URL bersih, dan halaman
  // yang sama tidak berakhir di dua alamat berbeda.
  it("leaves the first page unqueried", () => {
    const html = render({ current: 2, total: 60 });
    expect(html).toContain('href="/id/dashboard/submissions"');
    expect(html).toContain('href="/id/dashboard/submissions?page=2"');
  });

  // Pencarian aktif tidak boleh hilang saat berpindah halaman, termasuk saat
  // kembali ke halaman pertama yang tidak membawa `page`.
  it("carries extra query params on every link, including the first page", () => {
    const html = render({ current: 2, total: 60, query: { q: "design" } });
    expect(html).toContain('href="/id/dashboard/submissions?q=design"');
    expect(html).toContain(
      'href="/id/dashboard/submissions?q=design&amp;page=2"',
    );
  });

  it("marks the current page for assistive tech", () => {
    const html = render({ current: 2, total: 60 });
    expect(html).toContain('aria-current="page"');
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Message pages"');
  });

  // 500 pesan pada 25 per halaman = 20 halaman. Tanpa jendela, ini merender
  // deretan 20 tautan melintasi layar.
  it("collapses a long run around the current page", () => {
    const html = render({ current: 10, total: 500 });
    const labels = [...html.matchAll(/>(\d+|…)</g)].map((m) => m[1]);
    expect(labels).toEqual(["1", "…", "9", "10", "11", "…", "20"]);
  });

  it("keeps the last page reachable from the first", () => {
    const labels = [
      ...render({ current: 1, total: 500 }).matchAll(/>(\d+|…)</g),
    ].map((m) => m[1]);
    expect(labels[0]).toBe("1");
    expect(labels.at(-1)).toBe("20");
  });
});
