import React from "react";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import SectionWrapper from "@/components/layout/SectionWrapper";
import ContactForm from "@/components/interactive/ContactForm";
import Social from "@/components/ui/Social";
import { Locale } from "@/types/content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const header = dict.pageHeader.contact;

  return createMetadata({
    title: header.title,
    description: header.description,
    path: "/contact",
    siteConfig: dict.siteConfig,
    locale: validLocale,
  });
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const header = dict.pageHeader.contact;
  const socials = Object.entries(dict.siteConfig.socials);

  return (
    <PageWrapper>
      <SectionWrapper id="contact" spacing="sm">
        <div className="grid grid-cols-1 items-start gap-11 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="eyebrow m-center">{header.topTitle}</div>
            <h1 className="font-hand m-center mt-0.5 mb-2.5 text-[clamp(2.4rem,5.4vw,4rem)] leading-none">
              {header.title}
            </h1>
            <p className="m-justify mb-7 max-w-[520px] text-[16px] leading-[1.6] text-(--soft)">
              {header.description}
            </p>

            <ContactForm contactData={dict.contact} uiLabels={dict.ui} />
          </div>

          <div className="flex flex-col gap-[18px]">
            <div
              className="ink-border flat-3 bg-(--wash) p-[22px] max-sm:text-center"
              style={{
                borderRadius: "12px 28px 13px 30px / 30px 13px 28px 12px",
              }}
            >
              <div className="font-note mb-3 text-[20px]">
                {dict.ui.contactInfo.title}
              </div>
              {dict.contact.info.map((entry) => (
                <div key={entry.label} className="mb-3 last:mb-0">
                  <div className="micro">{entry.label}</div>
                  <div className="mt-0.5 text-[14px] font-semibold">
                    {entry.value}
                  </div>
                </div>
              ))}
            </div>

            <div
              className="ink-border flat-3 bg-(--paper) p-[22px] max-sm:text-center"
              style={{
                borderRadius: "28px 12px 30px 13px / 13px 30px 12px 28px",
              }}
            >
              <div className="font-note mb-3 text-[20px]">
                {dict.ui.contactInfo.findMe}
              </div>
              <div className="flex flex-wrap gap-[9px] max-sm:justify-center">
                {socials.map(([platform, url]) => (
                  <Social
                    key={platform}
                    platform={platform}
                    url={url}
                    variant="chip"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </PageWrapper>
  );
}
