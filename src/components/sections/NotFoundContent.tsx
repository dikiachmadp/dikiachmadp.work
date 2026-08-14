import Image from "next/image";
import { Locale, UiLabels } from "@/types/content";
import PageWrapper from "@/components/layout/PageWrapper";
import Button from "@/components/ui/Button";

interface NotFoundContentProps {
  dict: UiLabels["notFound"];
  locale: Locale;
}

export default function NotFoundContent({
  dict,
  locale,
}: NotFoundContentProps) {
  return (
    <PageWrapper>
      <div className="mx-auto w-full max-w-[820px] px-[22px] pt-[70px] text-center">
        {/* Same containment as ErrorContent — see the note there. The two
            blocks share this markup and should not drift apart. */}
        <div className="relative inline-block max-w-full px-[8%]">
          <h1 className="font-hand m-0 text-[clamp(6rem,20vw,13rem)] leading-[0.85]">
            {dict.heading}
          </h1>
          <span
            aria-hidden
            className="anim-wob absolute inset-x-0 top-[14%] h-[70%] border-2 border-dashed border-(--line) opacity-50"
            style={{ borderRadius: "52% 48% 45% 55% / 48% 52% 48% 52%" }}
          />
        </div>

        <p className="font-note mt-2.5 mb-1.5 text-[24px] text-(--soft)">
          {dict.badge}
        </p>
        <p className="mx-auto mb-[26px] max-w-[420px] text-[17px] leading-[1.6]">
          {dict.description}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Button href={`/${locale}`} variant="primary">
            {dict.btnHome}
          </Button>
          <Button href={`/${locale}/studio`} variant="secondary" mirrored>
            {dict.btnStudio}
          </Button>
        </div>

        <div
          className="ink-border flat-5 mt-10 overflow-hidden"
          style={{ borderRadius: "32px 13px 34px 14px / 14px 34px 13px 32px" }}
        >
          <Image
            src="/404.webp"
            alt=""
            width={1200}
            height={800}
            priority
            className="block h-auto w-full"
            style={{ filter: "grayscale(1) contrast(1.1)" }}
          />
        </div>
      </div>
    </PageWrapper>
  );
}
