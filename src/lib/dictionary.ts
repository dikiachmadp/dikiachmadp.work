import 'server-only';
import { Locale, FullDictionary } from '@/types/content';
import * as schemas from '@/schemas/content';

const loaders = {
  navigation: (lang: Locale) => import(`@/content/${lang}/navigation.json`).then((m) => m.default),
  siteConfig: (lang: Locale) => import(`@/content/${lang}/siteConfig.json`).then((m) => m.default),
  hero: (lang: Locale) => import(`@/content/${lang}/hero.json`).then((m) => m.default),
  projects: (lang: Locale) => import(`@/content/${lang}/projects.json`).then((m) => m.default),
  services: (lang: Locale) => import(`@/content/${lang}/services.json`).then((m) => m.default),
  about: (lang: Locale) => import(`@/content/${lang}/about.json`).then((m) => m.default),
  contact: (lang: Locale) => import(`@/content/${lang}/contact.json`).then((m) => m.default),
  studio: (lang: Locale) => import(`@/content/${lang}/studio.json`).then((m) => m.default),
  testimonials: (lang: Locale) => import(`@/content/${lang}/testimonials.json`).then((m) => m.default),
  footer: (lang: Locale) => import(`@/content/${lang}/footer.json`).then((m) => m.default),
  pageHeader: (lang: Locale) => import(`@/content/${lang}/pageHeader.json`).then((m) => m.default),
  sections: (lang: Locale) => import(`@/content/${lang}/sections.json`).then((m) => m.default),
  cta: (lang: Locale) => import(`@/content/${lang}/cta.json`).then((m) => m.default),
  privacy: (lang: Locale) => import(`@/content/${lang}/privacy.json`).then((m) => m.default),
  legal: (lang: Locale) => import(`@/content/${lang}/legal.json`).then((m) => m.default),
  ui: (lang: Locale) => import(`@/content/${lang}/ui.json`).then((m) => m.default),
};

export const getDictionary = async (lang: Locale): Promise<FullDictionary> => {
  try {
    const data = await Promise.all([
      loaders.navigation(lang),
      loaders.siteConfig(lang),
      loaders.hero(lang),
      loaders.projects(lang),
      loaders.services(lang),
      loaders.about(lang),
      loaders.contact(lang),
      loaders.studio(lang),
      loaders.testimonials(lang),
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
      projects: schemas.ProjectsDataSchema.parse(data[3]),
      services: schemas.ServicesDataSchema.parse(data[4]),
      about: schemas.AboutSchema.parse(data[5]),
      contact: schemas.ContactSchema.parse(data[6]),
      studio: schemas.StudioSchema.parse(data[7]),
      testimonials: schemas.TestimonialsSchema.parse(data[8]),
      footer: schemas.FooterSchema.parse(data[9]),
      pageHeader: schemas.PageHeaderSchema.parse(data[10]),
      sections: schemas.SectionsSchema.parse(data[11]),
      cta: schemas.CtaSchema.parse(data[12]),
      privacy: schemas.PolicySchema.parse(data[13]),
      legal: schemas.PolicySchema.parse(data[14]),
      ui: schemas.UiSchema.parse(data[15]),
    };
  } catch (error) {
    console.error("Zod Validation Error:", error);
    throw new Error("Failed to validate dictionary data. Check your JSON files.");
  }
};