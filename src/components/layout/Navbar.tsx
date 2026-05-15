"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Navigation, Locale } from "@/types/content";
import { cn } from "@/lib/utils";
import Logo from "@/components/ui/Logo";
import LanguageToggle from "@/components/interactive/LanguageToggle";
import DarkModeToggle from "@/components/interactive/DarkModeToggle";
import MobileMenu from "./MobileMenu";

interface NavbarProps {
  navData: Navigation;
  locale: Locale;
}

const hamburgerVariants: Variants = {
  opened: { rotate: 0 },
  closed: { rotate: 0 },
};

const lineTopVariants: Variants = {
  closed: { rotate: 0, y: 0 },
  opened: { rotate: 45, y: 6 },
};

const lineMiddleVariants: Variants = {
  closed: { opacity: 1, x: 0 },
  opened: { opacity: 0, x: 10 },
};

const lineBottomVariants: Variants = {
  closed: { rotate: 0, y: 0 },
  opened: { rotate: -45, y: -6 },
};

export default function Navbar({ navData, locale }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileOpen((v) => !v);
  };

  return (
    <>
      <nav
        className={cn(
          "sticky top-0 z-110 w-full border-b-2 transition-all duration-500",
          mobileOpen
            ? "border-transparent bg-transparent backdrop-blur-none"
            : "border-(--border) bg-(--background)/90 backdrop-blur-md",
        )}
      >
        <div className="main-container relative flex h-20 items-center justify-between gap-8">
          <Logo />
          <ul className="hidden flex-1 items-center justify-center gap-6 md:flex">
            {navData.main.map((item) => {
              const fullPath = `/${locale}${item.path === "/" ? "" : item.path}`;
              const isActive =
                pathname === fullPath ||
                (item.path !== "/" && pathname.startsWith(fullPath));

              return (
                <li key={item.path}>
                  <Link
                    href={fullPath}
                    className={cn(
                      "relative py-1 text-xs font-black uppercase tracking-widest transition-colors hover:text-(--accent)",
                      isActive ? "text-(--accent)" : "text-(--foreground)",
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-(--accent)"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <div className="hidden md:block">
              <LanguageToggle />
            </div>

            <div className="md:hidden">
              <motion.button
                className="flex h-10 w-10 flex-col items-center rounded-lg justify-center gap-1 border-2 border-(--foreground) bg-(--card) cursor-pointer outline-none transition-colors hover:border-(--foreground)"
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
                animate={mobileOpen ? "opened" : "closed"}
                variants={hamburgerVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {[lineTopVariants, lineMiddleVariants, lineBottomVariants].map(
                  (variants, i) => (
                    <motion.span
                      key={i}
                      className="h-0.5 w-5 bg-(--foreground)"
                      variants={variants}
                      transition={{
                        duration: 0.4,
                        ease: [0.65, 0, 0.35, 1],
                      }}
                    />
                  ),
                )}
              </motion.button>
            </div>
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
