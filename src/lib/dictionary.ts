import "server-only";
import { Locale, FullDictionary } from "@/types/content";
import * as schemas from "@/schemas/content";

const loaders = {
  navigation: (lang: Locale) =>
    import(`@/content/${lang}/navigation.json`).then((m) => m.default),
  siteConfig: (lang: Locale) =>
    import(`@/content/${lang}/siteConfig.json`).then((m) => m.default),
  hero: (lang: Locale) =>
    import(`@/content/${lang}/hero.json`).then((m) => m.default),
  projects: (lang: Locale) =>
    import(`@/content/${lang}/projects.json`).then((m) => m.default),
  services: (lang: Locale) =>
    import(`@/content/${lang}/services.json`).then((m) => m.default),
  contact: (lang: Locale) =>
    import(`@/content/${lang}/contact.json`).then((m) => m.default),
  studio: (lang: Locale) =>
    import(`@/content/${lang}/studio.json`).then((m) => m.default),
  footer: (lang: Locale) =>
    import(`@/content/${lang}/footer.json`).then((m) => m.default),
  pageHeader: (lang: Locale) =>
    import(`@/content/${lang}/pageHeader.json`).then((m) => m.default),
  sections: (lang: Locale) =>
    import(`@/content/${lang}/sections.json`).then((m) => m.default),
  cta: (lang: Locale) =>
    import(`@/content/${lang}/cta.json`).then((m) => m.default),
  privacy: (lang: Locale) =>
    import(`@/content/${lang}/privacy.json`).then((m) => m.default),
  legal: (lang: Locale) =>
    import(`@/content/${lang}/legal.json`).then((m) => m.default),
  ui: (lang: Locale) =>
    import(`@/content/${lang}/ui.json`).then((m) => m.default),
};

export const getDictionary = async (lang: Locale): Promise<FullDictionary> => {
  try {
    const data = await Promise.all([
      loaders.navigation(lang),
      loaders.siteConfig(lang),
      loaders.hero(lang),
      loaders.projects(lang),
      loaders.services(lang),
      loaders.contact(lang),
      loaders.studio(lang),
      loaders.footer(lang),
      loaders.pageHeader(lang),
      loaders.sections(lang),
      loaders.cta(lang),
      loaders.privacy(lang),
      loaders.legal(lang),
      loaders.ui(lang),
    ]);

    return {
      navigation: schemas.NavigationSchema.parse(data[0]),
      siteConfig: schemas.SiteConfigSchema.parse(data[1]),
      hero: schemas.HeroSchema.parse(data[2]),
      projects: schemas.ProjectsContentSchema.parse(data[3]),
      services: schemas.ServicesDataSchema.parse(data[4]),
      contact: schemas.ContactSchema.parse(data[5]),
      studio: schemas.StudioSchema.parse(data[6]),
      footer: schemas.FooterSchema.parse(data[7]),
      pageHeader: schemas.PageHeaderSchema.parse(data[8]),
      sections: schemas.SectionsSchema.parse(data[9]),
      cta: schemas.CtaSchema.parse(data[10]),
      privacy: schemas.PolicySchema.parse(data[11]),
      legal: schemas.PolicySchema.parse(data[12]),
      ui: schemas.UiSchema.parse(data[13]),
    };
  } catch (error) {
    console.error("Zod Validation Error:", error);
    throw new Error(
      "Failed to validate dictionary data. Check your JSON files.",
    );
  }
};
