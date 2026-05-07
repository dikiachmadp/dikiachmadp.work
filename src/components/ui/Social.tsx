import { cn } from "@/lib/utils";
import { FiInstagram, FiTwitter, FiGithub, FiLinkedin, FiFacebook } from "react-icons/fi";
import { SiBehance, SiDribbble, SiUpwork, SiFreelancer } from "react-icons/si";

interface SocialProps {
  platform: string;
  url: string;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: FiInstagram,
  twitter: FiTwitter,
  github: FiGithub,
  linkedin: FiLinkedin,
  facebook: FiFacebook,
  behance: SiBehance,
  dribbble: SiDribbble,
  upwork: SiUpwork,
  freelancer: SiFreelancer,
};

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

/**
 * Social media icon link with optional label.
 */
export default function Social({ platform, url, className, showLabel = false, size = "md" }: SocialProps) {
  const Icon = icons[platform.toLowerCase()];

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={platform}
      className={cn(
        "inline-flex items-center gap-2 text-(--foreground) hover:text-(--accent) transition-colors duration-150",
        className
      )}
    >
      {Icon ? (
        <Icon className={sizeClasses[size]} />
      ) : (
        <span className="text-xs font-black uppercase">{platform.charAt(0)}</span>
      )}
      {showLabel && (
        <span className="text-sm font-bold uppercase tracking-widest">{platform}</span>
      )}
    </a>
  );
}
