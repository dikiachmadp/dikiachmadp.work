"use client";

import { motion } from "framer-motion";
import { CtaData, UiLabels, Locale } from "@/types/content";
import Button from "@/components/ui/Button";

interface CTASectionProps {
  ctaData: CtaData;
  uiLabels: UiLabels;
  locale: Locale;
}

export default function CTASection({
  ctaData,
  uiLabels,
  locale,
}: CTASectionProps) {
  // PERBAIKAN: Tambahkan casting 'as keyof typeof uiLabels.buttons'
  const primaryLabel =
    uiLabels.buttons[
      ctaData.primaryButton.uiKey as keyof typeof uiLabels.buttons
    ] || ctaData.primaryButton.label;

  return (
    <section className="w-full bg-(--background) py-10 md:py-12">
      <div className="main-container">
        {/* PEMBUNGKUS KARTU (MOTION WRAPPER) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          /* Menghilangkan efek hover dan shadow luar, fokus pada bentuk kartu tunggal */
          className="relative bg-(--foreground) rounded-4xl"
        >
          {/* LAPISAN KONTEN (Posisinya CENTER di semua layar) */}
          <div
            className="
            relative w-full h-full 
            p-12 md:p-12
            flex flex-col items-center text-center 
            gap-8
          "
          >
            {/* Bagian Teks */}
            <div className="max-w-3xl">
              {/* Title: Murni Font Display */}
              <h2
                className="leading-[0.85] tracking-wide text-(--background)"
                style={{
                  fontSize: "var(--text-hero-top)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {ctaData.title}
              </h2>

              {/* Description: Fluid Desc */}
              <p
                className="text-(--background) font-medium mt-6 leading-relaxed opacity-90"
                style={{ fontSize: "var(--text-desc)" }}
              >
                {ctaData.description}
              </p>
            </div>

            {/* Bagian Tombol (Hanya Satu: Primary/Contact Me) */}
            <div className="flex justify-center">
              <Button
                href={`/${locale}${ctaData.primaryButton.link}`}
                variant="outline"
                className="min-w-52"
              >
                {primaryLabel}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
