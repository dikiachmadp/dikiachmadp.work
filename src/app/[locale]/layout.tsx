import type { Metadata } from "next";
import { Inter, Modak } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getDictionary } from "@/lib/dictionary";
import { Locale } from "@/types/content";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const modak = Modak({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-modak",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const { siteConfig } = dict;

  // 1. Mendefinisikan URL dasar dan URL spesifik bahasa
  const baseUrl = siteConfig.url || "https://dikiachmadp.work";
  const currentUrl = `${baseUrl}/${validLocale}`;

  return {
    // --- Primary Meta Tags ---
    title: {
      default: `${siteConfig.siteName} | ${siteConfig.fullName}`,
      template: `%s | ${siteConfig.siteName}`,
    },
    description: siteConfig.description,
    metadataBase: new URL(baseUrl),

    // --- Open Graph / Facebook ---
    openGraph: {
      type: "website",
      url: currentUrl,
      title: `${siteConfig.siteName} | ${siteConfig.fullName}`,
      description: siteConfig.description,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: siteConfig.siteName,
        },
      ],
    },

    // --- X (Twitter) ---
    twitter: {
      card: "summary_large_image",
      title: `${siteConfig.siteName} | ${siteConfig.fullName}`,
      description: siteConfig.description,
      images: "/og-image.png",
    },

    // --- Favicon & Icons ---
    icons: {
      icon: "/favicon.webp",
      shortcut: "/favicon.webp",
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
    <html lang={validLocale} suppressHydrationWarning>
      <body className={`${inter.variable} ${modak.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <Navbar navData={dict.navigation} locale={validLocale} />
          <main className="min-h-screen">{children}</main>
          <Footer
            footerData={dict.footer}
            siteConfig={dict.siteConfig}
            heroData={dict.hero}
            locale={validLocale}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
