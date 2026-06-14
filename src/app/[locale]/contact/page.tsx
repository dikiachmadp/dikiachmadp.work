import React from "react";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import ContactForm from "@/components/interactive/ContactForm";
import { Locale } from "@/types/content";
import { Mail, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const { pageHeader, siteConfig } = dict;
  const header = pageHeader.contact;

  return createMetadata({
    title: header.title,
    description: header.description,
    path: "/contact",
    siteConfig,
    locale: validLocale,
  });
}
export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const validLocale =
    resolvedParams.locale === "en" || resolvedParams.locale === "id"
      ? (resolvedParams.locale as Locale)
      : "en";

  const dict = await getDictionary(validLocale);
  const header = dict.pageHeader.contact;
  const themeTransition = "transition-colors duration-300";

  return (
    <PageWrapper>
      <PageHeader
        topTitle={header.topTitle}
        title={header.title}
        description={header.description}
      />
      <SectionWrapper id="contact-content">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start border-b-2 border-(--border) pb-12">
          <div className="lg:col-span-7">
            <ContactForm contactData={dict.contact} uiLabels={dict.ui} />
          </div>
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-(--foreground) rounded-2xl transition-all duration-300" />
              <div
                className={cn(
                  "relative p-8 rounded-2xl border-2 border-(--foreground) bg-(--background)",
                  "transition-all duration-300 ease-out",
                  "translate-x-0 translate-y-0",
                  "group-hover:-translate-x-1 group-hover:-translate-y-1",
                  themeTransition,
                )}
              >
                <h3 className="text-xl font-bold mb-6 text-(--foreground)">
                  {dict.ui.contactInfo.title}
                </h3>
                <div className="flex flex-col gap-4">
                  <a
                    href={`mailto:${dict.siteConfig.email}`}
                    className="flex items-center gap-3 text-(--foreground) hover:text-(--accent) transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    {dict.siteConfig.email}
                  </a>
                  <div className="flex items-center gap-3 text-(--foreground)">
                    <MapPin className="w-5 h-5" />
                    {dict.siteConfig.location}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </PageWrapper>
  );
}
