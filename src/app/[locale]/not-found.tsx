"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { RiAlarmWarningLine } from "react-icons/ri";
import PageWrapper from "@/components/layout/PageWrapper";
import { Locale, UiLabels } from "@/types/content";

interface NotFoundContentProps {
  dict: UiLabels["notFound"];
  locale: Locale;
}

export default function NotFoundContent({
  dict,
  locale,
}: NotFoundContentProps) {
  const floatVariants: Variants = {
    animate: {
      y: [0, -12, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const marqueeVariants: Variants = {
    animate: {
      x: [0, -1000],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop",
          duration: 30,
          ease: "linear",
        },
      },
    },
  };

  const repeatedMarquee = Array(4)
    .fill(dict?.marquee || "404 ")
    .join("");

  return (
    <PageWrapper className="min-h-screen w-full flex flex-col items-center justify-center bg-(--background) relative overflow-hidden px-4 py-12 md:py-24">
      <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 opacity-[0.03] pointer-events-none select-none z-0">
        <motion.div
          variants={marqueeVariants}
          animate="animate"
          className="whitespace-nowrap font-display text-[15vw] leading-none uppercase text-(--foreground)"
        >
          {repeatedMarquee}
        </motion.div>
      </div>

      <div className="relative z-10 max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 items-center justify-center gap-10 md:gap-16">
        <div className="w-full flex justify-center items-center order-1">
          <motion.div
            variants={floatVariants}
            animate="animate"
            className="w-full max-w-md aspect-4/3 bg-(--card) rounded-xl border border-(--foreground)/20 overflow-hidden shadow-[4px_4px_0px_0px_var(--foreground)] p-6 flex items-center justify-center"
          >
            <div className="relative w-full h-full min-h-60 md:min-h-70">
              <Image
                src="/404.webp"
                alt="404 Not Found Illustration"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>
        </div>

        <div className="w-full flex flex-col items-center md:items-start text-center md:text-left gap-6 order-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-full border border-(--foreground)/20 bg-(--card) px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-(--accent)"
          >
            <RiAlarmWarningLine size={14} />
            <span>{dict?.badge}</span>
          </motion.div>

          <div className="flex flex-col gap-3 w-full">
            <h1 className="text-2xl md:text-4xl font-display text-(--accent) tracking-wide uppercase leading-tight">
              {dict?.heading}
            </h1>
            <p className="text-sm md:text-base text-(--gray-medium) font-medium max-w-md md:max-w-none mx-auto md:mx-0 leading-relaxed">
              {dict?.description}
            </p>
          </div>

          <div className="w-full max-w-md bg-(--card) border border-(--foreground)/20 rounded-xl p-4 text-left font-mono text-xs text-(--gray-medium)">
            <span className="text-(--accent)">&gt;</span> {dict?.trace}
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 font-mono text-sm w-full">
            <Link
              href={`/${locale}`}
              className="px-5 py-2.5 rounded-xl border border-(--foreground)/20 bg-(--card) text-(--accent) font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_var(--foreground)]"
            >
              {dict?.btnHome}
            </Link>

            <Link
              href={`/${locale}/studio`}
              className="px-5 py-2.5 rounded-xl border border-(--foreground)/20 bg-(--card) text-(--gray-medium) font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_var(--foreground)]"
            >
              {dict?.btnStudio}
            </Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
