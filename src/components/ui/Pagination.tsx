import Link from "next/link";
import { pageCount, pageWindow } from "@/lib/pagination";

interface PaginationProps {
  /** Halaman aktif, berbasis 1. */
  current: number;
  /** Total baris, bukan total halaman — jumlah halaman dihitung di sini. */
  total: number;
  perPage: number;
  /** Path tanpa query, misalnya `/en/dashboard/projects`. */
  basePath: string;
  /** Dibacakan pembaca layar, contoh: "Messages pages". */
  label: string;
  /**
   * Param lain yang harus ikut di setiap tautan halaman, misalnya `{ q:
   * "design" }` dari kotak pencarian. Kosong secara default sehingga
   * pemanggil yang tidak membawa query tambahan berperilaku persis seperti
   * sebelumnya.
   */
  query?: Record<string, string>;
}

const linkBase =
  "r-tag ink-border px-3 py-1.5 text-[11px] font-bold min-w-[34px] text-center";

export default function Pagination({
  current,
  total,
  perPage,
  basePath,
  label,
  query,
}: PaginationProps) {
  const pages = pageCount(total, perPage);
  if (pages <= 1) return null;

  // Halaman pertama tidak perlu `page` — URL-nya tetap bersih — tapi param
  // lain (`q`, filter, dst.) harus ikut di setiap halaman termasuk yang
  // pertama, atau berpindah halaman diam-diam membuang pencarian aktif.
  const hrefFor = (n: number) => {
    const params = new URLSearchParams(query);
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav
      aria-label={label}
      className="mt-4 flex items-center justify-center gap-2"
    >
      {pageWindow(current, pages).map((n, i) =>
        n === null ? (
          <span
            key={`gap-${i}`}
            aria-hidden
            className="px-1 text-[11px] text-(--soft)"
          >
            …
          </span>
        ) : (
          <Link
            key={n}
            href={hrefFor(n)}
            aria-current={n === current ? "page" : undefined}
            className={
              n === current
                ? `${linkBase} bg-(--accent) text-white`
                : `${linkBase} lift-chip`
            }
          >
            {n}
          </Link>
        ),
      )}
    </nav>
  );
}
