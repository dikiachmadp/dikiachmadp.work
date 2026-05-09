"use client";

import { motion } from "framer-motion";
import { cn, themeTransition } from "@/lib/utils";

interface ServicesCardProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
}

/**
 * ServicesCard sebagai pembungkus (wrapper) visual 3D.
 * Menangani elevasi, hover, dan animasi tanpa mengatur konten di dalamnya.
 */
export default function ServicesCard({
  children,
  index = 0,
  className,
}: ServicesCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
      /* LAPISAN BAWAH (Shadow) */
      className={cn(
        "group relative bg-(--foreground) rounded-(--button-radius)",
        className,
        themeTransition,
      )}
    >
      {/* LAPISAN ATAS (Body Container) */}
      <div
        className="
        relative h-full p-4
        bg-(--background) 
        border-2 border-(--foreground) 
        rounded-(--button-radius)
        transition-all duration-300 ease-out
        
        translate-x-0 translate-y-0
        group-hover:-translate-x-1.5 group-hover:-translate-y-1.5
        cursor-default
      "
      >
        {children}
      </div>
    </motion.div>
  );
}
