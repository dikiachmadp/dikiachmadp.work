import React from "react";
import { getDictionary } from "@/lib/dictionary";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import ContactForm from "@/components/interactive/ContactForm";
import Social from "@/components/ui/Social";
import { Locale } from "@/types/content";
import { Mail } from "lucide-react";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const validLocale = (resolvedParams.locale === "en" || resolvedParams.locale === "id")
    ? (resolvedParams.locale as Locale)
    : "en";

  const dict = await getDictionary(validLocale);
  const header = dict.pageHeader.contact;

  return (
    <PageWrapper>
      <PageHeader
        topTitle={header.topTitle}
        title={header.title}
        description={header.description}
      />

      <SectionWrapper id="contact-content">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">

          {/* Left: Contact Info */}
          <div className="flex flex-col gap-10">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-(--gray-medium) mb-3">
                Email
              </p>
              <a
                href={`mailto:${dict.siteConfig.email}`}
                className="group inline-flex items-center gap-3 text-lg md:text-xl font-black uppercase hover:text-(--accent) transition-colors"
              >
                <Mail className="w-5 h-5 shrink-0 text-(--accent)" />
                {dict.siteConfig.email}
              </a>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-(--gray-medium) mb-4">
                Find me online
              </p>
              <div className="flex flex-col gap-3">
                {Object.entries(dict.siteConfig.socials).map(([platform, url]) => (
                  <Social
                    key={platform}
                    platform={platform}
                    url={url}
                    showLabel={true}
                    size="md"
                    className="text-base font-bold uppercase"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="border-2 border-(--border) p-6 md:p-10 bg-(--card)">
            <ContactForm contactData={dict.contact} uiLabels={dict.ui} />
          </div>

        </div>
      </SectionWrapper>
    </PageWrapper>
  );
}
