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

  return {
    title: {
      default: `${siteConfig.siteName} | ${siteConfig.fullName}`,
      template: `%s | ${siteConfig.siteName}`,
    },
    description: siteConfig.description,
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      type: "website",
      url: siteConfig.url,
      title: `${siteConfig.siteName} | ${siteConfig.fullName}`,
      description: siteConfig.description,
      images: [{ url: "/public/ogImage.webp", width: 1200, height: 628 }],
    },
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
        {/* Atribut disableTransitionOnChange telah dihapus dari sini */}
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
