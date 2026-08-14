import Image from "next/image";
import Link from "next/link";
import { Locale } from "@/types/content";

interface LogoProps {
  locale: Locale;
  wordmark: string;
  tagline: string;
}

export default function Logo({ locale, wordmark, tagline }: LogoProps) {
  return (
    <Link
      href={`/${locale}`}
      aria-label={wordmark}
      className="group flex shrink-0 items-center gap-3 outline-none"
    >
      <span className="r-blob-alt ink-border flex h-[46px] w-[46px] items-center justify-center overflow-hidden bg-(--wash) transition-transform duration-300 ease-out group-hover:scale-105 group-hover:rotate-[-8deg]">
        <Image
          src="/logo.webp"
          alt=""
          width={34}
          height={34}
          priority
          className="h-[34px] w-[34px] object-contain"
        />
      </span>
      <span className="leading-none">
        <span className="font-hand block text-[21px] tracking-[-0.01em]">
          {wordmark}
        </span>
        <span className="font-note mt-px block text-[14px] text-(--accent-ink)">
          {tagline}
        </span>
      </span>
    </Link>
  );
}
