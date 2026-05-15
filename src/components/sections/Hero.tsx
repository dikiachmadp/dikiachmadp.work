"use client";

import React from "react";
import { motion } from "framer-motion";
import { HeroData, Locale } from "@/types/content";
import VideoHero from "@/components/ui/VideoHero";
import StatBox from "@/components/ui/StatBox";
import SocialProof from "@/components/ui/SocialProof";

interface HeroProps {
  heroData: HeroData;
  locale: Locale;
}

export default function Hero({ heroData }: HeroProps) {
  return (
    <section className="relative w-full pt-12 md:pt-32 bg-(--background) text-(--foreground)">
      <div className="main-container">
        <div className="flex justify-start mb-12">
          <div className="flex items-center gap-3 px-4 py-2 border-2 border-(--border) bg-(--card) rounded-full shadow-flat">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--accent) opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-(--accent)"></span>
            </span>
            <span
              className="font-bold uppercase tracking-widest leading-none mt-2px"
              style={{ fontSize: "var(--text-ui-label)" }}
            >
              {heroData.availability.status}
            </span>
          </div>
        </div>

        <div className="flex flex-col-reverse lg:flex-row items-center gap-8 mb-20">
          <div className="w-full lg:w-1/2">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ fontFamily: "var(--font-display)" }}
              className="leading-[0.8] mb-8 uppercase"
            >
              <span
                className="block text-center md:text-left mb-6"
                style={{ fontSize: "var(--text-hero-top)" }}
              >
                {heroData.title.top}
              </span>

              <span
                className="text-(--accent) block text-center md:text-left"
                style={{ fontSize: "var(--text-hero-bottom)" }}
              >
                {heroData.title.bottom}
              </span>
            </motion.h1>

            <div className="max-w-xl space-y-8">
              <p
                className="font-medium leading-tight text-center md:text-left"
                style={{ fontSize: "var(--text-desc)" }}
              >
                {heroData.description}
              </p>

              <div
                className="flex justify-center md:justify-start"
                style={{ paddingTop: "var(--space-fluid-md)" }}
              >
                <SocialProof data={heroData.socialProof} />
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="relative p-2 bg-(--gray-soft) border-2 border-(--foreground) rounded-(--button-radius)">
              <div className="relative overflow-hidden aspect-video bg-black rounded-[calc(var(--button-radius)-4px)] border-2 border-(--foreground)">
                <VideoHero />
              </div>
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 justify-start gap-6 mb-24"
          style={{ paddingBottom: "var(--space-fluid-md)" }}
        >
          {heroData.stats.map((stat) => (
            <StatBox key={stat.id} label={stat.label} value={stat.value} />
          ))}
        </div>
      </div>
    </section>
  );
}
