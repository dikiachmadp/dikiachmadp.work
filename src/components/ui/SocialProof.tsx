"use client";

import React from "react";
import { Star } from "lucide-react";
import { cn, themeTransition } from "@/lib/utils";
import { HeroData } from "@/types/content";

// Mengambil interface langsung dari struktur data Hero
interface SocialProofProps {
  data: HeroData["socialProof"];
  className?: string;
}

export default function SocialProof({ data, className }: SocialProofProps) {
  const freelancerLink =
    "https://www.freelancer.com/signup?next=%2Fu%2Fdikiachmadp123%3Ffrm%3Ddikiachmadp123%26sb%3Dt";

  return (
    <a
      href={freelancerLink}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative inline-block outline-none",
        className,
        themeTransition,
      )}
    >
      {/* LAPISAN BAWAH (Shadow Accent) */}
      <div className="absolute inset-0 bg-(--accent) rounded-full translate-x-0 translate-y-0 transition-transform duration-200" />

      {/* LAPISAN ATAS (Body) */}
      <div
        className="
        relative flex items-center gap-3 
        bg-(--foreground) text-(--background) 
        px-5 py-2 rounded-full border-2 border-(--background)
        transition-transform duration-200
        group-hover:-translate-x-1 group-hover:-translate-y-1
      "
      >
        {/* Deretan Bintang berdasarkan nilai rating (misal: 5) */}
        <div className="flex items-center gap-0.5">
          {[...Array(Math.floor(data.rating))].map((_, i) => (
            <Star
              key={i}
              className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
            />
          ))}
        </div>

        {/* Teks Deskriptif Dinamis dari JSON */}
        <p
          className="font-bold tracking-tight whitespace-nowrap"
          /* Menggunakan variabel UI Label yang sudah kita buat di globals.css */
          style={{ fontSize: "var(--text-ui-label)" }}
        >
          <span className="tabular-nums">{data.score}</span>
          <span className="opacity-80 font-medium"> {data.totalClients} </span>
          <span className="tracking-normal">{data.platform}</span>
        </p>
      </div>
    </a>
  );
}
