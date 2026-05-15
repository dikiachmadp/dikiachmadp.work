"use client";

import { FooterData, SiteConfig, HeroData, Locale } from "@/types/content";
import Social from "@/components/ui/Social";
import { cn, themeTransition } from "@/lib/utils";
import Link from "next/link";

interface FooterProps {
  footerData: FooterData;
  siteConfig: SiteConfig;
  heroData: HeroData;
  locale: Locale;
}

export default function Footer({
  footerData,
  siteConfig,
  heroData,
  locale,
}: FooterProps) {
  const socialEntries = Object.entries(siteConfig.socials);

  const footerLinkContainer = cn(
    "relative inline-block transition-all duration-200 rounded-lg bg-[var(--foreground)]",
    themeTransition,
  );

  const footerLinkContent = cn(
    "flex h-10 w-24 items-center justify-center rounded-lg uppercase transition-all duration-200",
    "bg-[var(--background)] text-[var(--foreground)] border-2 border-[var(--border)]",
    "text-[10px] font-bold tracking-widest",
    "group-hover:-translate-x-1 group-hover:-translate-y-1",
  );

  return (
    <footer
      className={cn(
        "w-full border-t-2 border-(--border) bg-(--background) pb-8 pt-12 md:pt-8",
        themeTransition,
      )}
    >
      <div className="main-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-4 mb-10 md:mb-10">
          <div className="flex flex-col items-center md:items-start space-y-5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-(--border) bg-(--card)">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--accent) opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-(--accent)"></span>
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.15em] text-(--foreground)">
                {heroData.availability.status}
              </span>
            </div>

            <div className="flex flex-col items-center md:items-start leading-none">
              <h2 className="font-display text-5xl md:text-7xl tracking-wide text-(--accent) uppercase">
                {siteConfig.author}
              </h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.4em] text-(--gray)">
                {siteConfig.location}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end justify-center">
            <div className="flex flex-col items-center md:items-end gap-3">
              <span className="text-xs font-bold tracking-widest text-(--gray) uppercase">
                {footerData.socialLabel}
              </span>
              <div className="flex items-center gap-2">
                {socialEntries.map(([platform, url]) => (
                  <Social
                    key={platform}
                    platform={platform}
                    url={url}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full border-t-2 border-(--border) pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-(--gray-medium) order-2 md:order-1">
              {footerData.copyright}
            </p>

            <div className="flex gap-4 order-1 md:order-2">
              {[
                { label: "Legal", path: "/legal" },
                { label: "Privacy", path: "/privacy" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={`/${locale}${item.path}`}
                  className="group relative outline-none"
                >
                  {/* Container ini berfungsi sebagai bayangan (Layer Bawah) */}
                  <div className={footerLinkContainer}>
                    {/* Div ini adalah konten utama yang akan bergeser (Layer Atas) */}
                    <div className={footerLinkContent}>{item.label}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
