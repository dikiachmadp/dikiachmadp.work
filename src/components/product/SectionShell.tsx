import type { ReactNode } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import Markdown from "@/components/logbook/Markdown";

/**
 * Kerangka satu seksi halaman jualan: judul, pengantar opsional, lalu isinya.
 *
 * Sengaja tanpa SectionWrapper — seksi-seksi ini hidup di dalam kolom 980px
 * milik halaman detail produk, bukan di kontainer utama halaman.
 *
 * Pengantar dirender sebagai Markdown supaya salinan panjang bisa memuat
 * tautan dan daftar. Aman: Markdown.tsx memang sengaja tanpa `rehype-raw`,
 * jadi HTML mentah tidak pernah dieksekusi.
 */
export default function SectionShell({
  id,
  heading,
  intro,
  children,
}: {
  id: string;
  heading: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="pt-[64px]">
      <SectionHeading title={heading} />
      {intro.trim() !== "" && (
        <Markdown className="mb-7 text-[15px]">{intro}</Markdown>
      )}
      {children}
    </section>
  );
}
