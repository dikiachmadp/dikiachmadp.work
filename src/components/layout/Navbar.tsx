"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Navigation, SiteConfig, Locale } from "@/types/content";
import { cn } from "@/lib/utils";
import Logo from "@/components/ui/Logo";
import LanguageToggle from "@/components/interactive/LanguageToggle";
import DarkModeToggle from "@/components/interactive/DarkModeToggle";
import MobileMenu from "./MobileMenu";

interface NavbarProps {
  navData: Navigation;
  siteConfig: SiteConfig;
  locale: Locale;
}

export default function Navbar({ navData, siteConfig, locale }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);

  // A route change should never leave the sheet hanging open. Adjusting during
  // render rather than in an effect avoids a second paint with the stale menu.
  if (pathname !== openedAt) {
    setOpenedAt(pathname);
    setMobileOpen(false);
  }

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b-2 border-(--line) bg-(--paper) transition-colors duration-[0.45s]">
        <div className="main-container flex h-[78px] items-center justify-between gap-6">
          <Logo
            locale={locale}
            wordmark={siteConfig.author}
            tagline={siteConfig.tagline}
          />

          <ul className="hidden list-none items-center gap-1.5 p-0 lg:flex">
            {navData.main.map((item) => {
              const fullPath = `/${locale}${item.path === "/" ? "" : item.path}`;
              const isActive =
                pathname === fullPath ||
                (item.path !== "/" && pathname.startsWith(`${fullPath}/`));

              return (
                <li key={item.path}>
                  <Link
                    href={fullPath}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "r-chip block border-2 px-3.5 py-2 text-[13px] font-medium tracking-[0.02em]",
                      "transition-all duration-[0.22s] ease-out hover:-translate-x-[2px] hover:-translate-y-[2px] hover:border-(--line)",
                      isActive ? "border-(--line)" : "border-transparent",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block">
              <LanguageToggle />
            </div>
            <DarkModeToggle />

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              className="r-chip ink-border flex h-[34px] w-[38px] cursor-pointer flex-col items-center justify-center gap-[4px] bg-(--wash) outline-none transition-transform duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] lg:hidden"
            >
              <span
                className={cn(
                  "h-[2px] w-4 bg-(--ink) transition-transform duration-300",
                  mobileOpen && "translate-y-[6px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "h-[2px] w-4 bg-(--ink) transition-opacity duration-300",
                  mobileOpen && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "h-[2px] w-4 bg-(--ink) transition-transform duration-300",
                  mobileOpen && "-translate-y-[6px] -rotate-45",
                )}
              />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navData={navData}
        locale={locale}
        pathname={pathname}
      />
    </>
  );
}
