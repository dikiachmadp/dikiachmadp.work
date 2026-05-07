"use client";

import { motion } from "framer-motion";
import { TestimonialsData, SectionsData } from "@/types/content";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestimonialsSectionProps {
  testimonialsData: TestimonialsData;
  sectionsData: SectionsData;
}

export default function TestimonialsSection({ testimonialsData, sectionsData }: TestimonialsSectionProps) {
  const section = sectionsData.testimonials;

  return (
    <section className="w-full py-16 md:py-24 border-t-2 border-(--border) bg-(--card)">
      <div className="main-container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-12 pb-8 border-b-2 border-(--border)">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-(--gray-medium) mb-2">
              Testimonials
            </p>
            <h2 className="text-3xl md:text-5xl font-black uppercase leading-[0.9] tracking-tighter">
              {section.title}
            </h2>
          </div>
          {section.description && (
            <p className="max-w-xs text-sm font-medium text-(--gray-medium) md:text-right">
              {section.description}
            </p>
          )}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonialsData.items.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="border-2 border-(--border) p-6 md:p-8 bg-(--background) flex flex-col gap-6 hover:border-(--accent) transition-colors duration-200"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-(--accent) text-(--accent)" />
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-base font-medium leading-relaxed flex-1 italic">
                &ldquo;{testimonial.content}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-(--border)">
                <div className="w-10 h-10 rounded-full bg-(--accent) flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-black">
                    {testimonial.clientName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-black uppercase">{testimonial.clientName}</p>
                  <p className="text-xs text-(--gray-medium) font-medium">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
