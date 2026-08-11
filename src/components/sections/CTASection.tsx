import { CtaData, Locale } from "@/types/content";
import Button from "@/components/ui/Button";

interface CTASectionProps {
  ctaData: CtaData;
  locale: Locale;
}

/** Full-width ink panel — the only inverted surface in the whole design. */
export default function CTASection({ ctaData, locale }: CTASectionProps) {
  return (
    <div className="r-panel-lg ink-border flat-6 relative overflow-hidden bg-(--ink) px-10 py-[60px] text-center text-(--paper)">
      <div className="crosshatch-invert pointer-events-none absolute inset-0 opacity-[0.14]" />
      <div className="relative">
        <h2 className="font-hand mb-3.5 text-[clamp(2.2rem,5vw,4rem)] leading-none">
          {ctaData.title}
        </h2>
        <p className="mx-auto mb-7 max-w-[520px] text-[17px] leading-[1.6] opacity-[0.82]">
          {ctaData.description}
        </p>
        <Button
          href={`/${locale}${ctaData.primaryButton.link}`}
          variant="onDark"
          size="lg"
        >
          {ctaData.primaryButton.label}
        </Button>
      </div>
    </div>
  );
}
