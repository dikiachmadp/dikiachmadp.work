import React from "react";
import { getDictionary } from "@/lib/dictionary";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import ContactForm from "@/components/interactive/ContactForm";
import { Locale } from "@/types/content";

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
        <div className="flex flex-col gap-12">
          {/* Separator Border - Matching ProjectsGallery */}
          <div className="border-b-2 border-(--border) pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Form Area - Span 7 for focus */}
              <div className="lg:col-span-7">
                <ContactForm contactData={dict.contact} uiLabels={dict.ui} />
              </div>

              {/* Optional: Info Sidebar - Span 5 */}
              <div className="lg:col-span-5 flex flex-col gap-8">
                {/* Anda bisa menambahkan info kantor atau email di sini 
                     dengan style yang sama (Content Layer + Shadow Layer) jika diperlukan */}
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </PageWrapper>
  );
}
