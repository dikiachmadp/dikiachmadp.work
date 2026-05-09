"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn, themeTransition } from "@/lib/utils";

interface PageHeaderProps {
  topTitle?: string;
  title: string;
  description?: string;
  className?: string;
}

/**
 * Brutalist-styled page header with staggered reveal animations.
 */
export default function PageHeader({
  topTitle,
  title,
  description,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "w-full border-b-2 border-(--border) bg-(--background) pt-16 pb-12 md:pt-20 md:pb-16",
        className,
        themeTransition,
      )}
    >
      <div className="main-container">
        {topTitle && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-xs font-black uppercase tracking-[0.2em] text-(--gray-medium) mb-4"
          >
            {topTitle}
          </motion.p>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
          className="text-5xl md:text-7xl lg:text-8xl leading-[0.85] tracking-wide uppercase mb-6"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
            className="max-w-2xl text-base md:text-lg font-medium text-(--gray-medium) leading-relaxed"
          >
            {description}
          </motion.p>
        )}
      </div>
    </div>
  );
}
