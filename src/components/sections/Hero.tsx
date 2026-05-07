"use client";

import React from "react";
import { motion } from "framer-motion";
import { HeroData, Locale } from "@/types/content";
import VideoHero from "@/components/ui/VideoHero";

interface HeroProps {
  heroData: HeroData;
  locale: Locale;
}

export default function Hero({ heroData, locale }: HeroProps) {
  return (
    <section className="relative w-full pt-32 border-b-2 border-(--border) bg-(--background) text-(--foreground)">
      <div className="main-container">
        
        {/* 1. Header: Status & Social Proof */}
        <div className="flex justify-between items-start mb-12">
          {/* Menggunakan --card agar warna box berubah saat switch theme */}
          <div className="flex items-center gap-3 px-4 py-2 border-2 border-(--border) bg-(--card) rounded-full shadow-flat">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-widest leading-none mt-[2px]">
              {heroData.availability.status}
            </span>
          </div>
          
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-(--gray-medium) mb-1">
              {heroData.socialProof.platform}
            </p>
            <p className="text-2xl font-black">{heroData.socialProof.score}</p>
          </div>
        </div>

        {/* 2. Judul Utama - Menggunakan Font Display Modak */}
        <div className="grid grid-cols-1 gap-8 mb-20">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            /* Penerapan font-display dari globals.css */
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-[12vw] md:text-[9vw] leading-[0.8] font-black uppercase tracking-tighter italic"
          >
            {heroData.title.top} <br />
            <span className="text-(--accent)">{heroData.title.bottom}</span>
          </motion.h1>

          {/* Integrasi Video dengan Border & Shadow dari Token */}
          <div className="w-full border-2 border-(--border) overflow-hidden shadow-flat aspect-video md:aspect-[21/9] bg-(--card)">
            <VideoHero />
          </div>
        </div>

        {/* 3. Deskripsi Singkat */}
        <div className="max-w-2xl mb-24">
          <p className="text-xl md:text-3xl font-medium leading-tight opacity-90">
            {heroData.description}
          </p>
        </div>

        {/* 4. Statistik Performa - Full Theme-Aware */}
        <div className="grid grid-cols-2 md:grid-cols-3 border-t-2 border-(--border) divide-x-2 divide-(--border)">
          {heroData.stats.map((stat) => (
            <div 
              key={stat.id} 
              className="p-8 flex flex-col gap-2 bg-(--background) hover:bg-(--accent) hover:text-white transition-all group cursor-default"
            >
              <span className="text-4xl md:text-6xl font-black italic">{stat.value}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-(--gray-medium) group-hover:text-white/80">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}