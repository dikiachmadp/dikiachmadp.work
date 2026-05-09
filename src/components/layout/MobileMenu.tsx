"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Navigation, Locale } from "@/types/content";
import LanguageToggle from "@/components/interactive/LanguageToggle";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navData: Navigation;
  locale: Locale;
  pathname: string;
}

// Variants untuk animasi Circular Reveal menggunakan clip-path
const overlayVariants: Variants = {
  closed: {
    // Lingkaran kecil di sudut kanan atas (dekat hamburger)
    clipPath: "circle(0% at calc(100% - 40px) 40px)",
    opacity: 0,
    transition: {
      duration: 0.5,
      ease: [0.65, 0, 0.35, 1],
      // Memastikan opacity mati setelah clip-path selesai
      opacity: { delay: 0.3, duration: 0.2 },
    },
  },
  opened: {
    // Mekar menjadi lingkaran besar yang menutupi layar
    clipPath: "circle(150% at calc(100% - 40px) 40px)",
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.65, 0, 0.35, 1],
    },
  },
};

export default function MobileMenu({
  isOpen,
  onClose,
  navData,
  locale,
  pathname,
}: MobileMenuProps) {
  // Lock scroll saat menu terbuka
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="closed"
          animate="opened"
          exit="closed"
          variants={overlayVariants}
          className="fixed inset-0 z-100 flex flex-col bg-(--background) pt-24"
        >
          {/* Top Bar Dihapus (Close button diwakili oleh Hamburger di Navbar) */}

          {/* Center Nav Links - Font Display Besar */}
          <nav className="flex flex-1 flex-col items-center justify-center space-y-8 px-6">
            {navData.main.map((item, i) => {
              const fullPath = `/${locale}${item.path === "/" ? "" : item.path}`;
              const isActive =
                pathname === fullPath ||
                (item.path !== "/" && pathname.startsWith(fullPath));

              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    // Delay staggered, muncul setelah animasi clip-path berjalan
                    delay: 0.3 + i * 0.1,
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                >
                  <Link
                    href={fullPath}
                    onClick={onClose}
                    className={cn(
                      "font-display text-4xl tracking-wide transition-colors duration-300 md:text-7xl",
                      isActive
                        ? "text-(--accent)"
                        : "text-(--foreground) hover:text-(--accent)/70",
                    )}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Bottom Section - Hanya Language Toggle, Hardcode tulisan dihapus */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col items-center pb-12"
          >
            <LanguageToggle />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
