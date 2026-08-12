import { HeroData, Locale } from "@/types/content";
import Button from "@/components/ui/Button";

interface HeroProps {
  heroData: HeroData;
  locale: Locale;
}

export default function Hero({ heroData, locale }: HeroProps) {
  return (
    <section className="main-container pt-16">
      <div className="grid grid-cols-1 items-center gap-[52px] lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="r-chip ink-border mb-[26px] inline-flex items-center gap-[9px] bg-(--wash) px-3.5 py-[7px]">
            <span className="relative flex h-[9px] w-[9px]">
              <span className="anim-pulse-dot absolute inset-0 rounded-full bg-(--accent)" />
              <span className="relative h-[9px] w-[9px] rounded-full bg-(--accent)" />
            </span>
            <span className="text-[11px] font-bold tracking-[0.14em] uppercase">
              {heroData.availability.status}
            </span>
          </div>

          <h1 className="font-hand mb-0.5 text-[clamp(2.4rem,5.2vw,4.2rem)] leading-none tracking-[-0.02em]">
            {heroData.title.top}
          </h1>

          <div className="relative mb-[26px] inline-block">
            <span className="font-hand block text-[clamp(3.6rem,9vw,7.2rem)] leading-[0.92] tracking-[-0.03em] text-(--accent)">
              {heroData.title.bottom}
            </span>
            {/* Hand-drawn underline that draws itself once on load. */}
            <svg
              viewBox="0 0 300 18"
              preserveAspectRatio="none"
              aria-hidden
              className="absolute -bottom-2 left-0 h-[15px] w-full overflow-visible"
            >
              <path
                d="M2 12 C 60 4, 120 16, 180 8 S 280 6, 298 11"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="400"
                strokeDashoffset="400"
                style={{ animation: "dash 1.1s ease .35s forwards" }}
              />
            </svg>
          </div>

          <p className="mb-[26px] max-w-[470px] text-[17px] leading-[1.65] text-(--soft)">
            {heroData.description}
          </p>

          <div className="flex flex-wrap items-center gap-3.5">
            <Button href={`/${locale}/projects`} variant="primary">
              {heroData.ctaPrimary}
            </Button>
            <Button href={`/${locale}/contact`} variant="secondary" mirrored>
              {heroData.ctaSecondary}
            </Button>
            <span className="font-note flex items-center gap-[7px] text-[19px] text-(--soft)">
              <svg
                width="46"
                height="26"
                viewBox="0 0 46 26"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M2 20 C 12 2, 28 2, 40 10" />
                <path d="M40 10 L 31 9 M40 10 L 37 18" />
              </svg>
              {heroData.annotation}
            </span>
          </div>
        </div>

        <div className="relative">
          <span
            className="font-note absolute -top-4 left-[26px] z-3 border-2 border-dashed border-(--line) bg-(--wash) px-4 py-[5px] text-[18px] opacity-95"
            style={{ transform: "rotate(-6deg)" }}
          >
            {heroData.videoTag}
          </span>

          <div
            className="anim-float ink-border flat-6 relative bg-(--wash) p-2.5"
            style={{
              borderRadius: "22px 42px 22px 42px / 42px 22px 42px 22px",
            }}
          >
            <div
              className="crosshatch ink-border aspect-video overflow-hidden"
              style={{
                borderRadius: "16px 34px 16px 34px / 34px 16px 34px 16px",
              }}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                aria-label="Showreel"
                className="photo-ink h-full w-full object-cover"
              >
                <source src="/hero-video.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          <div className="ink-border flat-3 absolute -right-2.5 -bottom-[22px] z-3 flex h-24 w-24 items-center justify-center rounded-full bg-(--paper)">
            <span className="font-note text-center text-[17px] leading-[1.05] text-(--accent)">
              {heroData.craftBadge.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
