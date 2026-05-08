"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TestimonialsData, SectionsData } from "@/types/content";
import { Star, ArrowLeft, ArrowRight } from "lucide-react";
import ServicesCard from "@/components/ui/ServicesCard";

interface TestimonialsSectionProps {
  testimonialsData: TestimonialsData;
  sectionsData: SectionsData;
}

export default function TestimonialsSection({
  testimonialsData,
  sectionsData,
}: TestimonialsSectionProps) {
  const section = sectionsData.testimonials;
  const [index, setIndex] = useState(0);
  const items = testimonialsData.items;

  const next = () => setIndex((prev) => (prev + 1) % items.length);
  const prev = () =>
    setIndex((prev) => (prev - 1 + items.length) % items.length);

  const testimonial = items[index];

  return (
    <section className="w-full py-10 md:py-16 bg-(--background)">
      <div className="main-container flex flex-col items-center gap-12">
        {/* 1. Header - Selalu Center */}
        {section && (
          <div className="flex flex-col text-center max-w-3xl">
            <h2
              className="tracking-wide leading-[0.9]"
              style={{
                fontSize: "var(--text-section-title)",
                fontFamily: "var(--font-display)",
              }}
            >
              {section.title}
            </h2>
            {section.description && (
              <p
                className="text-(--gray-medium) font-medium leading-relaxed"
                style={{ fontSize: "var(--text-desc)" }}
              >
                {section.description}
              </p>
            )}
          </div>
        )}

        {/* 2. Spotlight Carousel - Horizontal Card tetap Center */}
        <div className="w-full flex flex-col items-center gap-10">
          <div className="w-full max-w-5xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ServicesCard index={index}>
                  {/* Container Card: Horizontal di desktop, vertikal di mobile */}
                  <div className="flex flex-col md:flex-row items-center md:items-stretch gap-8 md:gap-12">
                    {/* KIRI: Foto & Identitas */}
                    <div className="flex flex-col items-center text-center shrink-0 md:w-64 justify-center">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-(--accent) flex items-center justify-center border-2 border-(--foreground) shadow-[4px_4px_0px_0px_var(--foreground)] mb-4">
                        <span className="text-(--background) text-2xl font-black">
                          {testimonial.clientName.charAt(0)}
                        </span>
                      </div>
                      <p
                        className="font-black uppercase leading-tight"
                        style={{ fontSize: "var(--text-ui-label)" }}
                      >
                        {testimonial.clientName}
                      </p>
                      <p className="text-[10px] text-(--gray-medium) font-bold uppercase tracking-widest mt-1">
                        {testimonial.role}
                      </p>
                    </div>

                    {/* DIVIDER */}
                    <div className="w-full h-0.5 md:w-0.5 md:h-auto bg-(--border) opacity-50" />

                    {/* KANAN: Review & Stars */}
                    <div className="flex flex-col justify-center flex-1 gap-6">
                      <div className="flex gap-1 justify-center md:justify-start">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-5 h-5 fill-(--accent) text-(--accent)"
                          />
                        ))}
                      </div>

                      <blockquote
                        className="font-medium leading-relaxed italic text-center md:text-left"
                        style={{ fontSize: "var(--text-ui-label)" }}
                      >
                        &ldquo;{testimonial.content}&rdquo;
                      </blockquote>
                    </div>
                  </div>
                </ServicesCard>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 3. Navigation Buttons - Selalu Center */}
          <div className="flex gap-6 justify-center">
            <NavButton
              onClick={prev}
              icon={<ArrowLeft className="w-6 h-6" />}
            />
            <NavButton
              onClick={next}
              icon={<ArrowRight className="w-6 h-6" />}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * NavButton Internal
 */
function NavButton({
  onClick,
  icon,
}: {
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-(--foreground) rounded-full p-0 outline-none"
    >
      <div
        className="
        relative flex items-center justify-center w-14 h-14 
        bg-(--background) text-(--foreground) 
        border-2 border-(--foreground) rounded-full
        transition-transform duration-150 ease-out
        md:group-hover:-translate-x-1 md:group-hover:-translate-y-1
        active:translate-x-0 active:translate-y-0
      "
      >
        {icon}
      </div>
    </button>
  );
}
