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
}

const linkBase =
  "r-tag ink-border px-3 py-1.5 text-[11px] font-bold min-w-[34px] text-center";

export default function Pagination({
  current,
  total,
  perPage,
  basePath,
  label,
}: PaginationProps) {
  const pages = pageCount(total, perPage);
  if (pages <= 1) return null;

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
            // Halaman pertama tidak perlu query — URL-nya tetap bersih.
            href={n === 1 ? basePath : `${basePath}?page=${n}`}
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
