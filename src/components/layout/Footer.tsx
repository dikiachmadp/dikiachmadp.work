import Link from "next/link";
import { FooterData, SiteConfig, HeroData, Locale } from "@/types/content";
import Social from "@/components/ui/Social";
import { cn } from "@/lib/utils";

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
  const socials = Object.entries(siteConfig.socials);

  const bottomLinks = [
    { label: "Legal", href: `/${locale}/legal` },
    { label: "Privacy", href: `/${locale}/privacy` },
    { label: "Admin", href: `/${locale}/dashboard` },
    { label: "404", href: `/${locale}/404` },
  ];

  return (
    <footer className="mt-24 border-t-2 border-(--line) bg-(--wash) transition-colors duration-[0.45s]">
      <div className="main-container pt-[38px] pb-[26px]">
        <div className="grid grid-cols-1 items-end gap-8 pb-6 md:grid-cols-[1fr_auto]">
          <div>
            <div className="r-chip ink-border mb-3 inline-flex items-center gap-2 bg-(--paper) px-3 py-[5px]">
              <span className="anim-pulse-dot h-2 w-2 rounded-full bg-(--accent)" />
              <span className="text-[9px] font-bold tracking-[0.16em] uppercase">
                {heroData.availability.status}
              </span>
            </div>
            <h2 className="font-hand m-0 text-[clamp(2.4rem,7vw,4.6rem)] leading-[0.95]">
              {siteConfig.author}
            </h2>
            <p className="mt-1.5 text-[10px] font-bold tracking-[0.4em] text-(--soft) uppercase">
              {siteConfig.location}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2.5 md:items-end">
            <span className="font-note text-[19px] text-(--soft)">
              {footerData.socialLabel}
            </span>
            <div className="flex max-w-[300px] flex-wrap gap-2 md:justify-end">
              {socials.map(([platform, url]) => (
                <Social key={platform} platform={platform} url={url} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-dashed border-(--line) pt-4">
          <p className="m-0 text-[10px] font-semibold tracking-[0.06em] text-(--soft) uppercase">
            {footerData.copyright}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {bottomLinks.map((item, i) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "ink-border lift-chip bg-(--paper) px-[15px] py-[7px]",
                  "text-[10px] font-bold tracking-[0.12em] uppercase",
                  i % 2 === 0 ? "r-tag" : "r-chip-alt",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
