import { z } from "zod";

/**
 * 1. SHARED SCHEMAS (Reusable components)
 */
const NavItemSchema = z.object({
  label: z.string(),
  path: z.string(),
});

/**
 * 2. INDIVIDUAL FILE SCHEMAS
 */

// navigation.json
export const NavigationSchema = z.object({
  main: z.array(NavItemSchema),
  footer: z.array(NavItemSchema),
});

// siteConfig.json
export const SiteConfigSchema = z.object({
  siteName: z.string(),
  author: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  location: z.string(),
  url: z.string().url(),
  ogImage: z.string(),
  socials: z.record(z.string(), z.string().url()),
  defaultLanguage: z.string(),
  theme: z.enum(["dark", "light"]),
});

// hero.json
export const HeroSchema = z.object({
  title: z.object({
    top: z.string(),
    bottom: z.string(),
  }),
  description: z.string(),
  availability: z.object({
    status: z.string(),
    isAvailable: z.boolean(),
  }),
  socialProof: z.object({
    rating: z.number(),
    score: z.string(),
    totalClients: z.string(),
    platform: z.string(),
  }),
  stats: z.array(
    z.object({
      id: z.string(),
      value: z.string(),
      label: z.string(),
    }),
  ),
});

// projects.json
export const ProjectItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  year: z.string(),
  date: z.string(),
  client: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  coverImage: z.string(),
  logoUrl: z.string(),
  accent: z.string(),
  featured: z.boolean(),
  slug: z.string(),
});

export const ProjectsDataSchema = z.object({
  categories: z.array(z.string()),
  items: z.array(ProjectItemSchema),
});

// services.json
export const ServicesDataSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
      title: z.string(),
      summary: z.string(),
      deliverables: z.array(z.string()),
    }),
  ),
});

// about.json
export const AboutSchema = z.object({
  biography: z.array(z.string()),
  experience: z.array(
    z.object({
      year: z.string(),
      role: z.string(),
      place: z.string(),
    }),
  ),
  skills: z.array(
    z.object({
      category: z.string(),
      items: z.array(z.string()),
    }),
  ),
});

// contact.json
export const ContactSchema = z.object({
  form: z.object({
    id: z.string(),
    fields: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        label: z.string(),
        placeholder: z.string(),
        required: z.boolean(),
        options: z
          .array(
            z.object({
              value: z.string(),
              label: z.string(),
            }),
          )
          .optional(),
      }),
    ),
    submitAction: z.object({
      uiKey: z.string(),
    }),
  }),
});

// studio.json
export const StudioSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["thoughts", "store"]),
      title: z.string(),
      link: z.string(),
    }),
  ),
});

// testimonials.json
export const TestimonialsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      clientName: z.string(),
      role: z.string(),
      content: z.string(),
      avatarUrl: z.string(),
      projectRef: z.string(),
    }),
  ),
});

// footer.json
export const FooterSchema = z.object({
  socialLabel: z.string(),
  copyright: z.string(),
});

// pageHeader.json
const HeaderDetailSchema = z.object({
  topTitle: z.string(),
  title: z.string(),
  description: z.string(),
});

export const PageHeaderSchema = z.object({
  projects: HeaderDetailSchema,
  services: HeaderDetailSchema,
  about: HeaderDetailSchema,
  studio: HeaderDetailSchema,
  contact: HeaderDetailSchema,
});

// sections.json
const SectionSchema = z.object({
  title: z.string(),
  description: z.string(),
  showButton: z.boolean(),
  buttonLabel: z.string().optional(),
});

export const SectionsSchema = z.object({
  featuredProjects: SectionSchema,
  services: SectionSchema,
  testimonials: SectionSchema,
  cta: SectionSchema,
});

// cta.json
export const CtaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  primaryButton: z.object({
    label: z.string(),
    link: z.string(),
    uiKey: z.string(),
  }),
  secondaryButton: z.object({
    label: z.string(),
    link: z.string(),
    uiKey: z.string(),
  }),
});

// privacy.json & legal.json
export const PolicySchema = z.object({
  title: z.string(),
  lastUpdated: z.string(),
  description: z.string().optional(),
  points: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
      }),
    )
    .optional(),
  sections: z
    .array(
      z.object({
        heading: z.string(),
        content: z.string(),
      }),
    )
    .optional(),
});

// ui.json (General UI Labels/Strings)
export const UiSchema = z.object({
  buttons: z.record(z.string(), z.string()), // Memvalidasi objek di dalam 'buttons'
  states: z.record(z.string(), z.string()), // Memvalidasi objek di dalam 'states'
});
