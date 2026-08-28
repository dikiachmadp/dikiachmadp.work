import type { ReactNode } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import Markdown from "@/components/logbook/Markdown";
import { cn } from "@/lib/utils";

export type SectionTone = "plain" | "wash";

/**
 * Kerangka satu seksi halaman jualan: judul, pengantar opsional, lalu isinya.
 *
 * Sengaja tanpa SectionWrapper — seksi-seksi ini hidup di dalam kolom milik
 * halaman detail produk, bukan di kontainer utama halaman.
 *
 * Pengantar dirender sebagai Markdown supaya salinan panjang bisa memuat
 * tautan dan daftar. Aman: Markdown.tsx memang sengaja tanpa `rehype-raw`,
 * jadi HTML mentah tidak pernah dieksekusi.
 *
 * `tone` menentukan seksi mana yang duduk di atas panel ber-arsir dan mana yang
 * langsung di atas kertas. Nadanya datang dari `LANDING_SLOTS` di kode, bukan
 * dari data — aturan yang sama dengan `layout`: admin mengisi makna, kode
 * menentukan rupa. Tanpa selang-seling ini kedelapan seksi tampil dengan ritme
 * yang persis sama dan halaman terbaca sebagai satu kolom artikel panjang,
 * bukan etalase.
 */
export default function SectionShell({
  id,
  heading,
  intro,
  tone = "plain",
  children,
}: {
  id: string;
  heading: string;
  intro: string;
  tone?: SectionTone;
  children: ReactNode;
}) {
  const body = (
    <>
      <SectionHeading title={heading} />
      {intro.trim() !== "" && (
        <Markdown className="mb-7 text-[15px]">{intro}</Markdown>
      )}
      {children}
    </>
  );

  return (
    <section
      id={id}
      // Navbar-nya lengket, jadi tanpa offset ini melompat lewat jangkar akan
      // menaruh judul seksi tepat di baliknya.
      className="scroll-mt-[calc(var(--nav-h)+24px)] pt-[64px]"
    >
      {tone === "wash" ? (
        <div
          className={cn(
            "r-panel ink-border bg-(--wash) px-6 py-9 sm:px-9",
            // Panelnya sedikit melebar keluar kolom teks supaya pergantian
            // nada benar-benar terbaca sebagai pergantian, bukan sebagai kotak
            // yang kebetulan berwarna lain.
            "-mx-1.5 sm:-mx-5",
          )}
        >
          {body}
        </div>
      ) : (
        body
      )}
    </section>
  );
}
