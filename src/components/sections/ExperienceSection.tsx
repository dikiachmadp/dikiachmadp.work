"use client";

import { motion } from "framer-motion";
import { AboutData, UiLabels } from "@/types/content";
import { cn, themeTransition } from "@/lib/utils";

interface ExperienceSectionProps {
  aboutData: AboutData;
  uiLabels: UiLabels; // Menambahkan uiLabels untuk menghindari hardcode
}

export default function ExperienceSection({
  aboutData,
}: ExperienceSectionProps) {
  // Shared Brutalist Classes untuk Skill Tags
  const skillTagShadow =
    "absolute inset-0 bg-(--foreground) rounded-lg transition-all duration-200";
  const skillTagContent = cn(
    "relative bg-(--background) border-2 border-(--foreground) rounded-lg px-4 py-2",
    "text-[10px] font-bold uppercase tracking-widest text-(--foreground)",
    "group-hover:-translate-x-1 group-hover:-translate-y-1 transition-all duration-200",
    themeTransition,
  );

  return (
    <section className="w-full py-16 md:py-24 border-t-2 border-(--border) bg-(--background)">
      <div className="main-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* 1. Experience Timeline (Span 7) */}
          <div className="lg:col-span-7">
            <div className="flex flex-col">
              {aboutData.experience.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group relative flex gap-6 py-8 border-b-2 border-(--border) border-dashed last:border-none"
                >
                  {/* Indicator Dot with Modak Style if needed */}
                  <div className="shrink-0 w-3 h-3 rounded-full bg-(--foreground) mt-2 group-hover:bg-(--accent) transition-colors duration-300" />

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--accent)">
                      {item.year}
                    </span>
                    <h3 className="text-xl md:text-2xl uppercase leading-tight tracking-wide">
                      {item.role}
                    </h3>
                    <p className="text-sm font-medium text-(--gray-medium) uppercase tracking-wide">
                      {item.place}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 2. Skills (Span 5) */}
          <div className="lg:col-span-5">
            <div className="flex flex-col gap-10">
              {aboutData.skills.map((group, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <h3 className="text-(--text-ui-label) uppercase tracking-wide mb-5 ml-1">
                    {group.category}
                  </h3>

                  <div className="flex flex-wrap gap-4">
                    {group.items.map((item, idx) => (
                      <div key={idx} className="relative group cursor-default">
                        {/* Shadow Layer */}
                        <div className={skillTagShadow} />
                        {/* Content Layer */}
                        <div className={skillTagContent}>{item}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
