"use client";

import { cn, themeTransition } from "@/lib/utils";
import { FiInstagram, FiGithub, FiLinkedin } from "react-icons/fi";
import { SiDribbble, SiUpwork, SiFreelancer } from "react-icons/si";

interface SocialProps {
  platform: string;
  url: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: FiInstagram,
  github: FiGithub,
  linkedin: FiLinkedin,
  dribbble: SiDribbble,
  upwork: SiUpwork,
  freelancer: SiFreelancer,
};

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export default function Social({
  platform,
  url,
  className,
  size = "md",
}: SocialProps) {
  const Icon = icons[platform.toLowerCase()];

  return (
    <div className="group relative inline-block">
      {/* TOOLTIP: Kotak Brutalist yang muncul saat hover */}
      <span
        className={cn(
          "absolute -top-12 left-1/2 z-50 -translate-x-1/2 scale-0 px-3 py-1.5",
          "rounded-md border-2 border-(--border) bg-(--card) text-[10px] font-black uppercase tracking-widest text-(--foreground)",
          "shadow-[4px_4px_0px_0px_var(--foreground)] transition-all duration-300 ease-in-out group-hover:scale-100",
          themeTransition,
        )}
      >
        {platform}
      </span>

      {/* ICON BUTTON */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={platform}
        className={cn(
          "flex items-center justify-center rounded-lg border-2 border-(--border) bg-(--card) p-2.5",
          "transition-all duration-300 hover:-translate-y-1 hover:border-(--border) hover:shadow-[4px_4px_0px_0px_var(--foreground)]",
          "text-(--foreground) hover:text-(--foreground)",
          className,
          themeTransition,
        )}
      >
        {Icon ? (
          <Icon
            className={cn(
              sizeClasses[size],
              "transition-transform duration-300 group-hover:scale-125",
            )}
          />
        ) : (
          <span className="text-xs font-black uppercase">
            {platform.charAt(0)}
          </span>
        )}
      </a>
    </div>
  );
}
