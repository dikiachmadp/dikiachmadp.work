"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface AdminNavItem {
  label: string;
  href: string;
  /** Item terpilih hanya kalau path persis sama (dipakai untuk root dasbor). */
  exact?: boolean;
}

export default function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "r-tag ink-border px-3 py-[9px] text-[12px] font-bold transition-transform duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px]",
              active ? "bg-(--accent) text-white" : "bg-transparent",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
