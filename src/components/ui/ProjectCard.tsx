"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Project } from "@/types/content";
import { cn, themeTransition } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  index?: number;
  className?: string;
}

export default function ProjectCard({
  project,
  index = 0,
  className,
}: ProjectCardProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      className={cn(
        "group relative bg-(--foreground) rounded-(--button-radius)",
        className,
        themeTransition,
      )}
    >
      <Link
        href={`/${locale}/projects/${project.slug}`}
        className="block outline-none"
      >
        <div
          className="
          relative w-full h-full 
          bg-(--background) 
          border-2 border-(--foreground) 
          rounded-(--button-radius) 
          overflow-hidden 
          transition-all duration-300 ease-out
          translate-x-0 translate-y-0
          group-hover:-translate-x-1.5 group-hover:-translate-y-1.5
        "
        >
          {/* 1. Cover Image */}
          <div className="relative w-full overflow-hidden border-b-2 border-(--border) aspect-4/3 bg-(--card)">
            <Image
              src={project.coverImage}
              alt={project.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
              style={{ backgroundColor: project.accent }}
            />
          </div>

          {/* 2. Meta Info (Menggunakan Fluid Typography) */}
          <div className="pt-4 pb-2 px-4 border-b-2 border-(--border) flex justify-between items-start gap-4">
            <div className="grow">
              {/* Kategori & Tahun: Menggunakan UI Label Clamp */}
              <span
                className="font-bold uppercase tracking-widest text-(--gray-medium) block"
                style={{ fontSize: "var(--text-ui-label)" }}
              >
                {project.category} · {project.year}
              </span>

              {/* Judul Project: Menggunakan Title Scale yang lebih kecil dari Hero */}
              <h3
                className="leading-[1.1] mt-1 group-hover:text-(--accent)"
                style={{
                  fontSize: "clamp(1.25rem, 3vw, 1.75rem)", // Fluid khusus untuk title card
                  fontFamily: "var(--font-modak)",
                }}
              >
                {project.title}
              </h3>
            </div>

            {/* Logo Wrapper */}
            <div className="relative w-10 h-10 shrink-0 border-2 border-(--border) overflow-hidden bg-(--card) rounded-sm">
              <Image
                src={project.logoUrl}
                alt={`${project.title} logo`}
                fill
                sizes="40px"
                className="object-contain p-1"
              />
            </div>
          </div>

          {/* 3. Tags (Menggunakan Fluid UI Label) */}
          <div className="pt-3 pb-4 px-4 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="font-black uppercase tracking-widest px-2 py-1 border border-(--border) text-(--gray-medium)"
                style={{ fontSize: "calc(var(--text-ui-label) * 0.9)" }} // Sedikit lebih kecil dari label utama
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
