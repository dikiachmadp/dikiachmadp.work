import React from "react";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import PolicyDocument, {
  policyTabs,
} from "@/components/sections/PolicyDocument";
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

  return createMetadata({
    title: dict.pageHeader.legal.title,
    description: dict.pageHeader.legal.description,
    path: "/legal",
    siteConfig: dict.siteConfig,
    locale: validLocale,
  });
}

export default async function LegalPage({ params }: PageProps) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const [legalLabel, privacyLabel] = dict.navigation.footer.map((i) => i.label);

  return (
    <PageWrapper>
      <PolicyDocument
        policy={dict.legal}
        header={dict.pageHeader.legal}
        tabs={policyTabs(validLocale, [legalLabel, privacyLabel])}
        active="legal"
      />
    </PageWrapper>
  );
}
