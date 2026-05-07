"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Project } from "@/types/content";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  index?: number;
  className?: string;
}

export default function ProjectCard({ project, index = 0, className }: ProjectCardProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      className={cn("group", className)}
    >
      <Link href={`/${locale}/projects/${project.slug}`} className="block">
        {/* Cover Image */}
        <div className="relative w-full overflow-hidden border-2 border-(--border) aspect-[4/3] bg-(--card)">
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Accent overlay on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
            style={{ backgroundColor: project.accent }}
          />
          {/* Arrow icon */}
          <div className="absolute top-4 right-4 w-10 h-10 bg-(--background) border-2 border-(--border) flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200">
            <ArrowUpRight className="w-5 h-5 text-(--foreground)" />
          </div>
        </div>

        {/* Meta Info */}
        <div className="pt-4 pb-2 border-b-2 border-(--border) flex justify-between items-start gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-(--gray-medium)">
              {project.category} · {project.year}
            </span>
            <h3 className="text-xl md:text-2xl font-black uppercase leading-tight mt-1 group-hover:text-(--accent) transition-colors">
              {project.title}
            </h3>
          </div>
          {/* Logo */}
          <div className="relative w-10 h-10 shrink-0 border-2 border-(--border) overflow-hidden bg-(--card)">
            <Image
              src={project.logoUrl}
              alt={`${project.title} logo`}
              fill
              sizes="40px"
              className="object-contain p-1"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="pt-3 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-black uppercase tracking-widest px-2 py-1 border border-(--border) text-(--gray-medium)"
            >
              {tag}
            </span>
          ))}
        </div>
      </Link>
    </motion.div>
  );
}
