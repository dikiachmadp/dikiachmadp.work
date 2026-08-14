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
      className="group flex min-w-0 shrink items-center gap-2 outline-none sm:gap-3"
    >
      <span className="r-blob-alt ink-border flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden bg-(--wash) transition-transform duration-300 ease-out group-hover:scale-105 group-hover:rotate-[-8deg]">
        <Image
          src="/logo.webp"
          alt=""
          width={34}
          height={34}
          priority
          className="h-[34px] w-[34px] object-contain"
        />
      </span>
      {/* min-w-0 + truncate is the safety net: the navbar has no room to spare
          at 320px, so an over-long wordmark shrinks here instead of pushing the
          whole row past the viewport. At the current name nothing truncates. */}
      <span className="min-w-0 leading-none">
        <span className="font-hand block truncate text-[18px] tracking-[-0.01em] sm:text-[21px]">
          {wordmark}
        </span>
        <span className="font-note mt-px block truncate text-[12px] text-(--accent-ink) sm:text-[14px]">
          {tagline}
        </span>
      </span>
    </Link>
  );
}
