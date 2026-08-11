import Link from "next/link";
import { getDictionary } from "@/lib/dictionary";
import { Locale } from "@/types/content";
import DarkModeToggle from "@/components/interactive/DarkModeToggle";
import { cn } from "@/lib/utils";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const admin = dict.ui.admin;

  const navItems = [
    { label: admin.nav[0], href: `/${validLocale}/dashboard` },
    { label: admin.nav[1], href: `/${validLocale}/dashboard/projects` },
    { label: admin.nav[2], href: `/${validLocale}/contact` },
    { label: admin.nav[3], href: `/${validLocale}` },
  ];

  return (
    <div className="main-container py-11">
      <div className="grid grid-cols-1 items-start gap-[26px] lg:grid-cols-[210px_1fr]">
        <aside className="r-card ink-border flat-3 flex flex-col gap-1.5 bg-(--wash) p-[18px]">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="font-note text-[20px]">{admin.panelLabel}</span>
            <DarkModeToggle />
          </div>
          {navItems.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "r-tag ink-border px-3 py-[9px] text-[12px] font-bold transition-transform duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px]",
                i === 0 ? "bg-(--accent) text-white" : "bg-transparent",
              )}
            >
              {item.label}
            </Link>
          ))}
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
