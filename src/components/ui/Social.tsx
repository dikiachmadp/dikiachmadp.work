import type { IconType } from "react-icons";
import {
  SiInstagram,
  SiGithub,
  SiDribbble,
  SiFreelancer,
  SiUpwork,
  SiGooglescholar,
} from "react-icons/si";
// LinkedIn was pulled from Simple Icons upstream — SiLinkedin doesn't exist in
// this package version. Font Awesome still has it.
import { FaLinkedinIn } from "react-icons/fa6";
import { cn } from "@/lib/utils";

interface SocialProps {
  platform: string;
  url: string;
  /** `blob` is the 38px footer button; `chip` is the labelled contact-page pill. */
  variant?: "blob" | "chip";
  className?: string;
}

const ICON: Record<string, IconType> = {
  instagram: SiInstagram,
  github: SiGithub,
  linkedin: FaLinkedinIn,
  dribbble: SiDribbble,
  freelancer: SiFreelancer,
  upwork: SiUpwork,
  scholar: SiGooglescholar,
};

/** Fallback for any platform without a mapped icon above. */
const SHORT: Record<string, string> = {
  instagram: "IG",
  github: "GH",
  linkedin: "IN",
  dribbble: "DR",
  freelancer: "FR",
  upwork: "UP",
  scholar: "SC",
};

const LABEL: Record<string, string> = {
  instagram: "Instagram",
  github: "GitHub",
  linkedin: "LinkedIn",
  dribbble: "Dribbble",
  freelancer: "Freelancer",
  upwork: "Upwork",
  scholar: "Scholar",
};

export function socialLabel(platform: string) {
  return LABEL[platform.toLowerCase()] ?? platform;
}

export default function Social({
  platform,
  url,
  variant = "blob",
  className,
}: SocialProps) {
  const key = platform.toLowerCase();
  const Icon = ICON[key];
  const short = SHORT[key] ?? platform.slice(0, 2).toUpperCase();
  const label = socialLabel(platform);

  if (variant === "chip") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "r-chip ink-border lift-chip flex items-center gap-[7px] px-3 py-[7px]",
          "text-[11px] font-bold tracking-[0.08em] uppercase",
          className,
        )}
      >
        {Icon ? (
          <Icon size={13} aria-hidden />
        ) : (
          <span aria-hidden>{short}</span>
        )}
        {label}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={cn(
        "r-blob ink-border lift-blob flex h-[38px] w-[38px] items-center justify-center bg-(--paper)",
        "text-[10px] font-bold tracking-[0.04em]",
        className,
      )}
    >
      {Icon ? <Icon size={16} aria-hidden /> : <span aria-hidden>{short}</span>}
    </a>
  );
}
