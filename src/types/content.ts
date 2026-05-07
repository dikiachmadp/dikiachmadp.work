import { z } from 'zod';
import * as schemas from '@/schemas/content';

/**
 * Global Locale Type
 */
export type Locale = 'en' | 'id';

/**
 * Inferred Types dari Zod Schemas
 */
export type Navigation = z.infer<typeof schemas.NavigationSchema>;
export type SiteConfig = z.infer<typeof schemas.SiteConfigSchema>;
export type HeroData = z.infer<typeof schemas.HeroSchema>;
export type Project = z.infer<typeof schemas.ProjectItemSchema>;
export type ProjectsData = z.infer<typeof schemas.ProjectsDataSchema>;
export type ServicesData = z.infer<typeof schemas.ServicesDataSchema>;
export type AboutData = z.infer<typeof schemas.AboutSchema>;
export type ContactData = z.infer<typeof schemas.ContactSchema>;
export type StudioData = z.infer<typeof schemas.StudioSchema>;
export type TestimonialsData = z.infer<typeof schemas.TestimonialsSchema>;
export type FooterData = z.infer<typeof schemas.FooterSchema>;
export type PageHeaderData = z.infer<typeof schemas.PageHeaderSchema>;
export type SectionsData = z.infer<typeof schemas.SectionsSchema>;
export type CtaData = z.infer<typeof schemas.CtaSchema>;
export type PolicyData = z.infer<typeof schemas.PolicySchema>;
export type UiLabels = z.infer<typeof schemas.UiSchema>;

/**
 * Helper Type untuk Dictionary hasil gabungan
 */
export interface FullDictionary {
  navigation: Navigation;
  siteConfig: SiteConfig;
  hero: HeroData;
  projects: ProjectsData;
  services: ServicesData;
  about: AboutData;
  contact: ContactData;
  studio: StudioData;
  testimonials: TestimonialsData;
  footer: FooterData;
  pageHeader: PageHeaderData;
  sections: SectionsData;
  cta: CtaData;
  privacy: PolicyData;
  legal: PolicyData;
  ui: UiLabels;
}