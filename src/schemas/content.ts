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
  /** Handwritten line under the wordmark in the navbar. */
  tagline: z.string(),
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
  ctaPrimary: z.string(),
  ctaSecondary: z.string(),
  /** Rotated tag on the hero video frame. */
  videoTag: z.string(),
  /** Two lines inside the circular badge under the hero frame. */
  craftBadge: z.array(z.string()),
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
  /** Kunci kategori, bukan label — labelnya dicari per locale saat render. */
  categoryKey: z.string(),
  year: z.string(),
  date: z.string(),
  client: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  /** Empty means "no cover" — the card falls back to a cross-hatch panel. */
  coverImage: z.string(),
  logoUrl: z.string(),
  featured: z.boolean(),
  slug: z.string(),
  liveUrl: z.string().optional(),
  isLivePreview: z.boolean().optional(),
  role: z.string().optional(),
  duration: z.string().optional(),
  tools: z.array(z.string()).optional(),
  contentBlocks: z.array(z.string()).optional(),
  gallery: z.array(z.string()).optional(),
});

/**
 * Kategori punya kunci stabil dan label yang boleh berbeda tiap bahasa.
 *
 * Sebelumnya `categories` cuma `string[]` berisi label, dan filter publik
 * membandingkan label itu dengan label kategori tiap project — jadi
 * menerjemahkan salah satunya diam-diam membuat chip tidak pernah cocok.
 * `key` inilah yang dibandingkan sekarang; `label` murni untuk dibaca manusia.
 */
export const ProjectCategorySchema = z.object({
  key: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Kunci kategori hanya huruf kecil/angka/hubung"),
  label: z.string().min(1),
});

// Hanya bagian yang masih berasal dari JSON. Data project sendiri datang dari
// database lewat DAL; `items` di file JSON diabaikan (arsip konten pra-CMS).
export const ProjectsContentSchema = z.object({
  categories: z.array(ProjectCategorySchema),
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

export const ContactSchema = z.object({
  /** Right-hand "Contact information" card. */
  info: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
    }),
  ),
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
  sections: z.object({
    experiments: z.object({
      id: z.string(),
      title: z.string(),
      number: z.string(),
      buttonLabel: z.string(),
    }),
    store: z.object({
      id: z.string(),
      title: z.string(),
      number: z.string(),
      buttonLabel: z.string(),
    }),
  }),
  items: z.array(
    z.object({
      id: z.string(),
      // "store" pindah ke database (lihat lib/db/products.ts) — item dengan
      // tipe itu tidak lagi ditulis tangan di studio.json.
      type: z.enum(["experiments"]),
      title: z.string(),
      link: z.string(),
      description: z.string().optional(),
      date: z.string().optional(),
      isExternal: z.boolean().optional(),
      thumbnail: z.string().optional(),
      buttonLabel: z.string().optional(),
      /** Two- or three-character mark shown in the card's blob. */
      badge: z.string().optional(),
    }),
  ),
});

export const TestimonialItemSchema = z.object({
  id: z.string(),
  clientName: z.string(),
  role: z.string(),
  content: z.string(),
  avatarUrl: z.string(),
  projectRef: z.string(),
});

export const TestimonialsSchema = z.object({
  items: z.array(TestimonialItemSchema),
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
  logbook: HeaderDetailSchema,
  products: HeaderDetailSchema,
  contact: HeaderDetailSchema,
  legal: HeaderDetailSchema,
  privacy: HeaderDetailSchema,
});

const SectionSchema = z.object({
  /** Handwritten line above the section heading. */
  eyebrow: z.string().optional(),
  title: z.string(),
  description: z.string(),
  showButton: z.boolean(),
  buttonLabel: z.string().optional(),
});

export const SectionsSchema = z.object({
  featuredProjects: SectionSchema,
  services: SectionSchema,
  testimonials: SectionSchema,
  logbook: SectionSchema,
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
    close: z.string(),
  }),
  states: z.object({
    empty: z.string(),
    error: z.string(),
    success: z.string(),
    rateLimited: z.string(),
    loading: z.string(),
    notFound: z.string(),
    comingSoon: z.string(),
    allCategories: z.string(),
    searchPlaceholder: z.string(),
    searchPlaceholderLogbook: z.string(),
    searchPlaceholderProducts: z.string(),
    skipToContent: z.string(),
  }),
  // Nama aksesibel dan teks alt: tidak pernah terlihat di layar, jadi paling
  // gampang tertinggal saat menerjemahkan. Yang memakai `{placeholder}`
  // dirakit lewat fill() di lib/utils.
  a11y: z.object({
    toggleMenu: z.string(),
    menuDialog: z.string(),
    switchToLight: z.string(),
    switchToDark: z.string(),
    switchToLanguage: z.string(),
    // Endonyms — a language is named in its own language in both files, so a
    // screen reader hears "Bahasa Indonesia", never "Indonesian".
    languageNames: z.object({ en: z.string(), id: z.string() }),
    previousTestimonial: z.string(),
    nextTestimonial: z.string(),
    ratingOutOfFive: z.string(),
    projectCover: z.string(),
    projectShot: z.string(),
    galleryPlaceholder: z.string(),
    logbookGallery: z.string(),
    enlargeImage: z.string(),
    imageDialog: z.string(),
    previousImage: z.string(),
    nextImage: z.string(),
    showImage: z.string(),
  }),
  // Dipakai error boundary, yang wajib Client Component dan karena itu tidak
  // bisa memanggil getDictionary() — ui.json diimpor langsung di sana.
  errorPage: z.object({
    badge: z.string(),
    heading: z.string(),
    description: z.string(),
    retry: z.string(),
    btnHome: z.string(),
    digestLabel: z.string(),
  }),
  notFound: z.object({
    marquee: z.string(),
    badge: z.string(),
    heading: z.string(),
    description: z.string(),
    trace: z.string(),
    btnHome: z.string(),
    btnStudio: z.string(),
  }),
  projectDetail: z.object({
    aboutProject: z.string(),
    client: z.string(),
    datePublished: z.string(),
    role: z.string(),
    duration: z.string(),
    tools: z.string(),
    techStack: z.string(),
    backBtn: z.string(),
    visitBtn: z.string(),
    galleryLabel: z.string(),
    notFoundTitle: z.string(),
  }),
  logbook: z.object({
    backBtn: z.string(),
    share: z.string(),
    shareCopied: z.string(),
    notFoundTitle: z.string(),
    empty: z.string(),
    readPost: z.string(),
    viewAll: z.string(),
    readTime: z.string(),
    prevPost: z.string(),
    nextPost: z.string(),
  }),
  products: z.object({
    backBtn: z.string(),
    notFoundTitle: z.string(),
    empty: z.string(),
    viewAll: z.string(),
    buyBtn: z.string(),
    galleryLabel: z.string(),
  }),
  contactInfo: z.object({
    title: z.string(),
    findMe: z.string(),
  }),
  admin: z.object({
    panelLabel: z.string(),
    greeting: z.string(),
    dashboard: z.string(),
    newProject: z.string(),
    recentProjects: z.string(),
    inbox: z.string(),
    logout: z.string(),
    nav: z.array(z.string()),
    stats: z.array(z.string()),
    status: z.object({
      live: z.string(),
      draft: z.string(),
      archived: z.string(),
    }),
  }),
});
