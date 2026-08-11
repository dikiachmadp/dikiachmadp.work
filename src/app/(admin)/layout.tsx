import { Kalam, Caveat, Space_Grotesk } from "next/font/google";
import "../globals.css";
import ThemeProvider from "@/components/layout/ThemeProvider";
import PaperTexture from "@/components/layout/PaperTexture";

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

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
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
