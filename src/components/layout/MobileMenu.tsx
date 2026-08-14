"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Navigation, Locale } from "@/types/content";
import { cn } from "@/lib/utils";
import LanguageToggle from "@/components/interactive/LanguageToggle";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navData: Navigation;
  locale: Locale;
  pathname: string;
}

export default function MobileMenu({
  isOpen,
  onClose,
  navData,
  locale,
  pathname,
}: MobileMenuProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Whatever had focus when the sheet opened — in practice the hamburger.
    const opener = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    // The sheet hides the page but leaves the navbar visible and usable, so
    // only what sits behind it goes inert. Without this the sheet is opaque to
    // the eye and transparent to the keyboard: Tab walks off the last link
    // straight into a page the user cannot see.
    // The skip link joins them: it is still reachable by Shift+Tab out of the
    // sheet, and it points at #main-content, which is now inert.
    const behind = [
      document.getElementById("main-content"),
      document.querySelector("footer"),
      document.querySelector(".skip-link"),
    ].filter((el): el is HTMLElement => el !== null);
    behind.forEach((el) => el.setAttribute("inert", ""));

    sheetRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      behind.forEach((el) => el.removeAttribute("inert"));

      // Give focus back to the opener when it would otherwise fall to <body> —
      // which is where it lands both on Escape and after a link click, since
      // the focused link unmounts with the sheet. Verified in the browser:
      // either way focus ends on the hamburger, a stable spot in a navbar that
      // survives the route change, rather than nowhere.
      const active = document.activeElement;
      if (!active || active === document.body) opener?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const links = [...navData.main, ...navData.footer];

  return (
    <div
      ref={sheetRef}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      // TODO(i18n): the last English string left in this component; it moves to
      // the dictionary with the other hardcoded aria-labels.
      aria-label="Menu"
      tabIndex={-1}
      className="fixed inset-x-0 top-(--nav-h) bottom-0 z-40 overflow-y-auto bg-(--paper) outline-none lg:hidden"
    >
      <div className="main-container flex flex-col gap-2 py-8">
        {links.map((item, index) => {
          const fullPath = `/${locale}${item.path === "/" ? "" : item.path}`;
          const isActive =
            pathname === fullPath ||
            (item.path !== "/" && pathname.startsWith(`${fullPath}/`));

          return (
            <Link
              key={item.path}
              href={fullPath}
              onClick={onClose}
              className={cn(
                "ink-border flat-3 lift-btn font-hand px-5 py-3 text-[22px]",
                index % 2 === 0 ? "r-btn" : "r-btn-alt",
                isActive ? "bg-(--wash)" : "bg-(--paper)",
              )}
            >
              {item.label}
            </Link>
          );
        })}

        <div className="mt-4 w-fit sm:hidden">
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
}
