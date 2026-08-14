import type { Metadata } from "next";
import { Kalam, Caveat, Space_Grotesk } from "next/font/google";
import "@/app/globals.css";
import ThemeProvider from "@/components/layout/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PaperTexture from "@/components/layout/PaperTexture";
import { getDictionary } from "@/lib/dictionary";
import { Locale } from "@/types/content";

const kalam = Kalam({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-kalam",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

// Semua halaman di bawah /[locale] membaca database. Dengan mengembalikan []
// saat SKIP_DB_STATIC_GEN diset, `next build` di CI tidak memprerender satu
// pun dan karenanya tidak butuh database sama sekali.
export async function generateStaticParams() {
  if (process.env.SKIP_DB_STATIC_GEN) return [];
  return [{ locale: "en" }, { locale: "id" }];
}

// Jaring pengaman kalau ada mutasi yang lupa memanggil revalidateProjectPaths.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const { siteConfig } = dict;
  const baseUrl = siteConfig.url || "https://dikiachmadp.work";
  const currentUrl = `${baseUrl}/${validLocale}`;

  return {
    title: {
      default: `${siteConfig.siteName} | ${siteConfig.fullName}`,
      template: `%s | ${siteConfig.siteName}`,
    },
    description: siteConfig.description,
    metadataBase: new URL(baseUrl),

    alternates: {
      canonical: currentUrl,
      languages: {
        "en-US": `${baseUrl}/en`,
        "id-ID": `${baseUrl}/id`,
        "x-default": `${baseUrl}/en`,
      },
    },

    openGraph: {
      type: "website",
      url: currentUrl,
      title: `${siteConfig.siteName} | ${siteConfig.fullName}`,
      description: siteConfig.description,
      images: [
        {
          url: "/ogImage.webp",
          width: 1200,
          // Berkasnya benar-benar 1200×628, bukan 1200×630. Dimensi yang
          // dideklarasikan dipakai untuk memesan ruang sebelum gambar terunduh,
          // jadi angkanya harus cocok dengan berkasnya.
          height: 628,
          alt: siteConfig.siteName,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${siteConfig.siteName} | ${siteConfig.fullName}`,
      description: siteConfig.description,
      images: "/ogImage.webp",
    },

    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        // Sebelumnya berkas ini ada di /public tapi tidak pernah dirujuk.
        // Artwork-nya sama dengan ikon lain; ukurannya yang lebih besar
        // dipakai tab dan bookmark di layar high-DPI. Yang di atas tetap
        // jadi fallback untuk browser tanpa dukungan WebP.
        { url: "/favicon.webp", sizes: "192x192", type: "image/webp" },
      ],
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
      other: [
        {
          rel: "icon",
          url: "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
        },
      ],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);

  return (
    // The font variables must live on :root — globals.css resolves --font-hand
    // and friends there, and a custom property can only reference another one
    // that is defined on the same element.
    <html
      lang={validLocale}
      suppressHydrationWarning
      className={`${kalam.variable} ${caveat.variable} ${grotesk.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <PaperTexture />
          <div className="relative z-1 flex min-h-screen flex-col">
            <a href="#main-content" className="skip-link">
              {dict.ui.states.skipToContent}
            </a>
            <Navbar
              navData={dict.navigation}
              siteConfig={dict.siteConfig}
              locale={validLocale}
            />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer
              footerData={dict.footer}
              siteConfig={dict.siteConfig}
              heroData={dict.hero}
              locale={validLocale}
            />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
