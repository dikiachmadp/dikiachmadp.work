"use client";

import { motion } from "framer-motion";
import { AboutData } from "@/types/content";
import { cn } from "@/lib/utils";

interface ExperienceSectionProps {
  aboutData: AboutData;
}

export default function ExperienceSection({ aboutData }: ExperienceSectionProps) {
  return (
    <section className="w-full py-16 md:py-24 border-t-2 border-(--border) bg-(--background)">
      <div className="main-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Experience Timeline */}
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-10 pb-4 border-b-2 border-(--border)">
              Experience
            </h2>
            <div className="flex flex-col gap-0">
              {aboutData.experience.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex gap-6 py-6 border-b border-(--border) group"
                >
                  <div className="shrink-0 w-2 h-2 rounded-full bg-(--accent) mt-2 group-hover:scale-150 transition-transform" />
                  <div className="flex-1">
                    <span className="text-xs font-black uppercase tracking-widest text-(--gray-medium) block mb-1">
                      {item.year}
                    </span>
                    <h3 className="text-lg font-black uppercase leading-tight">{item.role}</h3>
                    <p className="text-sm font-medium text-(--gray-medium) mt-1">{item.place}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-10 pb-4 border-b-2 border-(--border)">
              Skills
            </h2>
            <div className="flex flex-col gap-8">
              {aboutData.skills.map((group, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <h3 className="text-xs font-black uppercase tracking-widest text-(--gray-medium) mb-4">
                    {group.category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 border-2 border-(--border) text-sm font-bold uppercase tracking-wide hover:bg-(--accent) hover:text-white hover:border-(--accent) transition-all duration-150 cursor-default"
                      >
                        {item}
                      </span>
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
