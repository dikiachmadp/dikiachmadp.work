"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Locale } from "@/types/content";
import { cn } from "@/lib/utils";
import Logo from "@/components/ui/Logo";
import LanguageToggle from "@/components/interactive/LanguageToggle";
import DarkModeToggle from "@/components/interactive/DarkModeToggle";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  navData: Navigation;
  locale: Locale;
}

export default function Navbar({ navData, locale }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b-2 border-(--border) bg-(--background)/90 backdrop-blur-md">
        <div className="main-container h-20 flex items-center justify-between gap-8">

          {/* Logo */}
          <Logo />

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center gap-6 flex-1 justify-center">
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
                      "text-xs font-black uppercase tracking-widest transition-colors hover:text-(--accent) relative py-1",
                      isActive
                        ? "text-(--accent)"
                        : "text-(--foreground)"
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

          {/* Controls */}
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <LanguageToggle />

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center border-2 border-(--border) bg-(--card) hover:bg-(--accent) hover:text-white transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 border-b-2 border-(--border) bg-(--background) md:hidden"
          >
            <div className="main-container py-6 flex flex-col gap-2">
              {navData.main.map((item, i) => {
                const fullPath = `/${locale}${item.path === "/" ? "" : item.path}`;
                const isActive =
                  pathname === fullPath ||
                  (item.path !== "/" && pathname.startsWith(fullPath));

                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={fullPath}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "block py-3 px-4 text-sm font-black uppercase tracking-widest border-l-4 transition-all",
                        isActive
                          ? "border-(--accent) text-(--accent) bg-(--card)"
                          : "border-transparent text-(--foreground) hover:border-(--border)"
                      )}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
