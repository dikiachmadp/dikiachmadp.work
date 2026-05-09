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
  const validLocale =
    resolvedParams.locale === "en" || resolvedParams.locale === "id"
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
          {/* Right: Form */}
          <div className="border-2 border-(--border) p-6 md:p-10 bg-(--card)">
            <ContactForm contactData={dict.contact} uiLabels={dict.ui} />
          </div>
        </div>
      </SectionWrapper>
    </PageWrapper>
  );
}
