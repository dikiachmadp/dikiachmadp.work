"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CtaData, UiLabels, Locale } from "@/types/content";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CTASectionProps {
  ctaData: CtaData;
  uiLabels: UiLabels;
  locale: Locale;
}

export default function CTASection({ ctaData, uiLabels, locale }: CTASectionProps) {
  const primaryLabel = uiLabels.buttons[ctaData.primaryButton.uiKey] || ctaData.primaryButton.label;
  const secondaryLabel = uiLabels.buttons[ctaData.secondaryButton.uiKey] || ctaData.secondaryButton.label;

  return (
    <section className="w-full border-t-2 border-(--border) bg-(--card) py-20 md:py-28">
      <div className="main-container">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
          <div className="max-w-2xl">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-4xl md:text-6xl lg:text-7xl leading-[0.85] tracking-tighter uppercase mb-4"
            >
              {ctaData.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="text-base md:text-lg text-(--gray-medium) font-medium"
            >
              {ctaData.description}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 shrink-0"
          >
            <Link
              href={`/${locale}${ctaData.primaryButton.link}`}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-(--accent) text-white border-2 border-(--accent) text-sm font-black uppercase tracking-widest hover:bg-transparent hover:text-(--accent) transition-all duration-150 active:translate-x-[2px] active:translate-y-[2px]"
            >
              {primaryLabel}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href={`/${locale}${ctaData.secondaryButton.link}`}
              className="inline-flex items-center gap-3 px-8 py-4 bg-transparent text-(--foreground) border-2 border-(--border) text-sm font-black uppercase tracking-widest hover:border-(--accent) hover:text-(--accent) transition-all duration-150 active:translate-x-[2px] active:translate-y-[2px]"
            >
              {secondaryLabel}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
