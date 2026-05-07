"use client";

import Link from "next/link";
import { FooterData, SiteConfig, Locale } from "@/types/content";
import Logo from "@/components/ui/Logo";
import Social from "@/components/ui/Social";

interface FooterProps {
  footerData: FooterData;
  siteConfig: SiteConfig;
  locale: Locale;
}

export default function Footer({ footerData, siteConfig, locale }: FooterProps) {
  const socialEntries = Object.entries(siteConfig.socials);

  return (
    <footer className="w-full border-t-2 border-(--border) bg-(--background) pt-14 pb-8 mt-0">
      <div className="main-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="text-xs font-medium text-(--gray-medium) max-w-[200px] leading-relaxed">
              {siteConfig.fullName} — Graphic Designer, UI/UX Designer & 3D Artist.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-(--gray-medium)">
              {footerData.socialLabel}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {socialEntries.map(([platform, url]) => (
                <Social
                  key={platform}
                  platform={platform}
                  url={url}
                  showLabel={true}
                  size="sm"
                  className="text-xs font-bold uppercase tracking-wide"
                />
              ))}
            </div>
          </div>

          {/* Email CTA */}
          <div className="flex flex-col gap-4 md:items-end">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-(--gray-medium)">
              Let&apos;s connect
            </p>
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-sm font-black uppercase hover:text-(--accent) transition-colors underline underline-offset-4"
            >
              {siteConfig.email}
            </a>
            <Link
              href={`/${locale}/contact`}
              className="text-xs font-black uppercase tracking-widest px-4 py-2 border-2 border-(--border) hover:bg-(--accent) hover:border-(--accent) hover:text-white transition-all duration-150"
            >
              Start a Project →
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t-2 border-(--border) flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-xs font-medium text-(--gray-medium)">
            {footerData.copyright}
          </p>
          <div className="flex items-center gap-6">
            <Link href={`/${locale}/legal`} className="text-xs font-bold uppercase tracking-widest text-(--gray-medium) hover:text-(--accent) transition-colors">
              Legal
            </Link>
            <Link href={`/${locale}/privacy`} className="text-xs font-bold uppercase tracking-widest text-(--gray-medium) hover:text-(--accent) transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
