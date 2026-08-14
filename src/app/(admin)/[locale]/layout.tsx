import { Kalam, Caveat, Space_Grotesk } from "next/font/google";
import "../../globals.css";
import ThemeProvider from "@/components/layout/ThemeProvider";
import PaperTexture from "@/components/layout/PaperTexture";
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

/**
 * Root layout for the admin route group.
 *
 * It sits *inside* the [locale] segment rather than above it, which is the
 * only way it can read `params` and put the real language on <html>. When it
 * lived at (admin)/layout.tsx the lang was hardcoded "en", so a screen reader
 * on the Indonesian dashboard announced Indonesian copy with English
 * pronunciation. The public side already does it this way — see
 * app/[locale]/layout.tsx — and a route group may hold its root layout at any
 * depth as long as nothing above it declares one.
 */
export default async function AdminRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;

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
        >
          <PaperTexture />
          <div className="relative z-1">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
