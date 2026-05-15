import { z } from "zod";

const NavItemSchema = z.object({
  label: z.string(),
  path: z.string(),
});

export const NavigationSchema = z.object({
  main: z.array(NavItemSchema),
  footer: z.array(NavItemSchema),
});

export const SiteConfigSchema = z.object({
  siteName: z.string(),
  author: z.string(),
  fullName: z.string(),
  description: z.string(),
  email: z.string().email(),
  location: z.string(),
  url: z.string().url(),
  ogImage: z.string(),
  socials: z.record(z.string(), z.string().url()),
  defaultLanguage: z.string(),
  theme: z.enum(["dark", "light"]),
});

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

export const FooterSchema = z.object({
  socialLabel: z.string(),
  copyright: z.string(),
});

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

export const UiSchema = z.object({
  buttons: z.object({
    viewAllWork: z.string(),
    viewAllServices: z.string(),
    contactMe: z.string(),
    submit: z.string(),
    loading: z.string(),
    success: z.string(),
    download: z.string(),
  }),
  states: z.object({
    empty: z.string(),
    error: z.string(),
    loading: z.string(),
    notFound: z.string(),
    comingSoon: z.string(),
    allCategories: z.string(),
    searchPlaceholder: z.string(),
  }),
});
