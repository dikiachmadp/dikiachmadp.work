import { getDictionary } from "@/lib/dictionary";
import { Locale } from "@/types/content";
import AdminNav from "@/components/admin/AdminNav";
import DarkModeToggle from "@/components/interactive/DarkModeToggle";
import { requireUser } from "@/lib/supabase/auth";
import { logout } from "./actions";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  // Gerbang untuk seluruh subtree dasbor; server action tetap memeriksa
  // sendiri karena bisa dipanggil tanpa merender layout ini.
  await requireUser(validLocale);
  const dict = await getDictionary(validLocale);
  const admin = dict.ui.admin;

  const navItems = [
    { label: admin.nav[0], href: `/${validLocale}/dashboard`, exact: true },
    { label: admin.nav[1], href: `/${validLocale}/dashboard/projects` },
    { label: admin.nav[2], href: `/${validLocale}/dashboard/testimonials` },
    { label: admin.nav[3], href: `/${validLocale}/dashboard/submissions` },
    { label: admin.nav[4], href: `/${validLocale}`, exact: true },
  ];

  return (
    <div className="main-container py-11">
      {/* The dashboard has a sidebar to tab past, same as the public navbar,
          so it gets the same escape hatch — reusing .skip-link and the string
          the public layout already localises. */}
      <a href="#main-content" className="skip-link">
        {dict.ui.states.skipToContent}
      </a>
      <div className="grid grid-cols-1 items-start gap-[26px] lg:grid-cols-[210px_1fr]">
        <aside className="r-card ink-border flat-3 flex flex-col gap-1.5 bg-(--wash) p-[18px]">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="font-note text-[20px]">{admin.panelLabel}</span>
            <DarkModeToggle />
          </div>
          <AdminNav items={navItems} />

          <form action={logout} className="mt-1.5">
            <input type="hidden" name="formLocale" value={validLocale} />
            <button
              type="submit"
              className="r-tag ink-border w-full cursor-pointer bg-transparent px-3 py-[9px] text-[12px] font-bold text-(--soft) transition-transform duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px]"
            >
              {admin.logout}
            </button>
          </form>
        </aside>

        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
