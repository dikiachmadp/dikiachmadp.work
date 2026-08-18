"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Navigation, SiteConfig, Locale } from "@/types/content";
import { cn } from "@/lib/utils";
import { uiDictionary } from "@/lib/ui-dictionary";
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
  const a11y = uiDictionary(locale).a11y;
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
      {/* id-nya dipakai dialog layar penuh untuk menonaktifkan navbar di
          belakangnya — lihat Gallery.tsx. Selector `nav` saja tidak cukup:
          paginasi dan breadcrumb juga merender <nav>. */}
      <nav
        id="site-nav"
        className="sticky top-0 z-50 w-full border-b-2 border-(--line) bg-(--paper) transition-colors duration-[0.45s]"
      >
        <div className="main-container flex h-(--nav-h) items-center justify-between gap-2 sm:gap-6">
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
              aria-label={a11y.toggleMenu}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              className="r-chip ink-border relative flex h-[34px] w-[38px] cursor-pointer items-center justify-center bg-(--wash) transition-transform duration-200 outline-none hover:-translate-x-[2px] hover:-translate-y-[2px] lg:hidden"
            >
              {/* All three bars anchor to the exact same center point
                  (top-1/2 left-1/2, self-centered) instead of stacking in a
                  gapped flex column. The old version derived its 6px offset
                  from the column's gap + bar height, so open and closed never
                  quite lined back up on the same axis — the middle bar's
                  translate/opacity easing lagged the outer bars' rotation
                  just enough to leave a visible third stroke mid-transition.
                  Converging on one point removes that axis entirely: closed
                  bars sit ±7px off-center via `calc(50% ± 7px)`, open bars
                  return to dead center and rotate, and the middle bar is
                  additionally squashed to zero width so no sliver survives
                  at the crossing point. */}
              <span
                className={cn(
                  "absolute top-1/2 left-1/2 h-[2px] w-4 -translate-x-1/2 bg-(--ink) transition-all duration-300",
                  mobileOpen
                    ? "-translate-y-1/2 rotate-45"
                    : "-translate-y-[calc(50%+7px)]",
                )}
              />
              <span
                className={cn(
                  "absolute top-1/2 left-1/2 h-[2px] w-4 -translate-x-1/2 -translate-y-1/2 bg-(--ink) transition-all duration-300",
                  mobileOpen && "scale-x-0 opacity-0",
                )}
              />
              <span
                className={cn(
                  "absolute top-1/2 left-1/2 h-[2px] w-4 -translate-x-1/2 bg-(--ink) transition-all duration-300",
                  mobileOpen
                    ? "-translate-y-1/2 -rotate-45"
                    : "translate-y-[calc(-50%+7px)]",
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
