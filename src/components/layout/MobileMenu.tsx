"use client";

import Link from "next/link";
import { useEffect } from "react";
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
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const links = [...navData.main, ...navData.footer];

  return (
    <div className="fixed inset-x-0 top-[78px] bottom-0 z-40 overflow-y-auto bg-(--paper) lg:hidden">
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
