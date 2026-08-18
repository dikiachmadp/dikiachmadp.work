import { z } from "zod";
import * as schemas from "@/schemas/content";

export type Locale = "en" | "id";

export type Navigation = z.infer<typeof schemas.NavigationSchema>;
export type SiteConfig = z.infer<typeof schemas.SiteConfigSchema>;
export type HeroData = z.infer<typeof schemas.HeroSchema>;
export type Project = z.infer<typeof schemas.ProjectItemSchema>;
/** Bagian projects yang berasal dari JSON (label kategori). */
export type ProjectsContent = z.infer<typeof schemas.ProjectsContentSchema>;
export type ProjectCategory = z.infer<typeof schemas.ProjectCategorySchema>;
/** Yang diterima komponen: label dari JSON + item dari database. */
export type ProjectsData = ProjectsContent & { items: Project[] };
export type ServicesData = z.infer<typeof schemas.ServicesDataSchema>;
export type ContactData = z.infer<typeof schemas.ContactSchema>;
export type StudioData = z.infer<typeof schemas.StudioSchema>;
export type StudioItem = StudioData["items"][number];
export type TestimonialsData = z.infer<typeof schemas.TestimonialsSchema>;
export type TestimonialItem = z.infer<typeof schemas.TestimonialItemSchema>;
export type FooterData = z.infer<typeof schemas.FooterSchema>;
export type PageHeaderData = z.infer<typeof schemas.PageHeaderSchema>;
export type SectionsData = z.infer<typeof schemas.SectionsSchema>;
export type CtaData = z.infer<typeof schemas.CtaSchema>;
export type PolicyData = z.infer<typeof schemas.PolicySchema>;
export type UiLabels = z.infer<typeof schemas.UiSchema>;

export interface FullDictionary {
  navigation: Navigation;
  siteConfig: SiteConfig;
  hero: HeroData;
  projects: ProjectsContent;
  services: ServicesData;
  contact: ContactData;
  studio: StudioData;
  footer: FooterData;
  pageHeader: PageHeaderData;
  sections: SectionsData;
  cta: CtaData;
  privacy: PolicyData;
  legal: PolicyData;
  ui: UiLabels;
}
