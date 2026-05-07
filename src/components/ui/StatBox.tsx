"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatBoxProps {
  value: string;
  label: string;
  className?: string;
  index?: number;
}

/**
 * Animated stat display box with brutalist styling.
 */
export default function StatBox({ value, label, className, index = 0 }: StatBoxProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className={cn(
        "flex flex-col gap-2 p-8 border-2 border-(--border) bg-(--card) hover:bg-(--accent) hover:text-white group transition-all duration-200 cursor-default",
        className
      )}
    >
      <span className="text-4xl md:text-5xl font-black italic leading-none">
        {value}
      </span>
      <span className="text-xs font-bold uppercase tracking-widest text-(--gray-medium) group-hover:text-white/80 transition-colors">
        {label}
      </span>
    </motion.div>
  );
}
