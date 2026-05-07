"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ServicesData, SectionsData, UiLabels, Locale } from "@/types/content";
import { ArrowRight } from "lucide-react";

interface ServicesPreviewProps {
  servicesData: ServicesData;
  sectionsData: SectionsData;
  uiLabels: UiLabels;
  locale: Locale;
}

export default function ServicesPreview({
  servicesData,
  sectionsData,
  uiLabels,
  locale,
}: ServicesPreviewProps) {
  const section = sectionsData.services;
  const buttonLabel = section.buttonLabel ? uiLabels.buttons[section.buttonLabel] || section.buttonLabel : "";

  return (
    <section className="w-full py-16 md:py-24 border-t-2 border-(--border) bg-(--background)">
      <div className="main-container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12 pb-8 border-b-2 border-(--border)">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-(--gray-medium) mb-2">Services</p>
            <h2 className="text-3xl md:text-5xl font-black uppercase leading-[0.9] tracking-tighter">
              {section.title}
            </h2>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <p className="max-w-xs text-sm font-medium text-(--gray-medium) md:text-right">
              {section.description}
            </p>
            {section.showButton && buttonLabel && (
              <Link
                href={`/${locale}/services`}
                className="group inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-(--accent) hover:underline underline-offset-4"
              >
                {buttonLabel}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>

        {/* Services List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-2 border-(--border)">
          {servicesData.items.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="p-6 md:p-8 border-b-2 lg:border-b-0 border-r-0 md:border-r-2 last:border-b-0 border-(--border) flex flex-col gap-4 hover:bg-(--card) transition-colors group"
            >
              <div className="flex justify-between items-center">
                <span className="text-3xl font-black font-mono text-(--accent) opacity-40 group-hover:opacity-100 transition-opacity">
                  {String(service.order).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-lg font-black uppercase leading-tight">{service.title}</h3>
              <p className="text-sm font-medium text-(--gray-medium) leading-relaxed">{service.summary}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
