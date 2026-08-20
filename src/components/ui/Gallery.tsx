"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UiLabels } from "@/types/content";
import { cn, fill } from "@/lib/utils";

/** Structurally what Logbook's `LogbookImageItem` and a mapped project
 *  `gallery: string[]` both already satisfy — no import from either domain. */
export type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  caption?: string;
};

/**
 * Galeri gambar dipakai ulang di halaman detail Logbook dan Project. Bentuknya
 * mengikuti jumlah gambar:
 *
 * - **0** — tidak dirender sama sekali; tidak ada bingkai kosong yang tersisa.
 * - **1** — satu gambar besar, tanpa baris thumbnail yang tak ada gunanya.
 * - **2+** — gambar besar plus baris thumbnail yang menggulir sendiri kalau
 *   jumlahnya banyak.
 *
 * Mengklik gambar besar membukanya dalam dialog zoom. Dialognya memakai ulang
 * pola yang sudah terbukti di `MobileMenu.tsx`: `role="dialog"` + `aria-modal`,
 * fokus masuk saat dibuka dan kembali ke pemicunya saat ditutup, isi di
 * belakangnya diberi `inert`, Escape menutup.
 */

export default function Gallery({
  images,
  title,
  ui,
  dateLabel,
  moreLabel,
  fit = "cover",
}: {
  images: GalleryImage[];
  title: string;
  ui: UiLabels;
  /** Post's published date, pre-formatted for the locale (see
   *  `PostCard.formatPublishedAt`) — shown as a floating stamp on the frame.
   *  Omitted (draft preview, no date yet) simply skips the stamp. */
  dateLabel?: string;
  /** Label above the thumbnail row, e.g. "more from this log" / "more from
   *  this project" — caller-owned copy instead of a Logbook-specific string
   *  baked into this shared component. */
  moreLabel: string;
  /** `"cover"` crops to fill the frame (Logbook's original behaviour);
   *  `"contain"` shows the whole image letterboxed, for sources whose aspect
   *  ratio shouldn't be cropped (project screenshots). */
  fit?: "cover" | "contain";
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const a11y = ui.a11y;
  const count = images.length;

  const step = useCallback(
    (delta: number) => setActive((i) => (i + delta + count) % count),
    [count],
  );

  useEffect(() => {
    if (!zoomed) return;

    // Ditangkap saat dialog dibuka, bukan dibaca saat pembersihan: yang harus
    // menerima fokus kembali adalah tombol yang membukanya.
    const opener = openerRef.current;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
      if (count < 2) return;
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    // Dialognya menutupi seluruh layar, jadi semuanya kecuali dialog itu
    // sendiri jadi inert — tanpa ini Tab berjalan keluar dialog ke halaman yang
    // tidak bisa dilihat pengguna. Navbar ikut, berbeda dari MobileMenu yang
    // sengaja membiarkannya karena lembarnya duduk di bawah navbar.
    const behind = [
      document.getElementById("main-content"),
      document.getElementById("site-nav"),
      document.querySelector("footer"),
      document.querySelector(".skip-link"),
    ].filter((el): el is HTMLElement => el !== null);
    behind.forEach((el) => el.setAttribute("inert", ""));

    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      behind.forEach((el) => el.removeAttribute("inert"));
      // Fokus kembali ke gambar yang membukanya, bukan jatuh ke <body>.
      const focused = document.activeElement;
      if (!focused || focused === document.body) opener?.focus();
    };
  }, [zoomed, count, step]);

  // Thumbnail yang aktif digulirkan ke dalam pandangan; dengan banyak gambar
  // barisnya jadi carousel, dan panah papan ketik bisa memindahkan pilihan ke
  // thumbnail yang sedang berada di luar layar.
  useEffect(() => {
    thumbsRef.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  if (count === 0) return null;

  const current = images[active];
  const galleryLabel = fill(a11y.imageGallery, { title });

  return (
    <section aria-label={galleryLabel} className="mb-9">
      <div className="relative">
        <div className="r-frame ink-border flat-5 bg-(--wash) p-2.5">
          <button
            ref={openerRef}
            type="button"
            onClick={() => setZoomed(true)}
            aria-label={a11y.enlargeImage}
            className="r-frame-inner ink-border relative block aspect-video w-full cursor-zoom-in overflow-hidden"
          >
            <Image
              src={current.url}
              alt={current.alt}
              fill
              sizes="(max-width: 980px) 100vw, 960px"
              priority
              className={fit === "contain" ? "object-contain" : "object-cover"}
            />
          </button>
        </div>

        {dateLabel && (
          <span
            aria-hidden
            className="r-tag ink-border flat-3 font-note absolute -top-4 right-6 rotate-3 bg-(--paper) px-3 pt-0.5 pb-1 text-[19px]"
          >
            {dateLabel}
          </span>
        )}
      </div>

      {current.caption && (
        <p className="font-note mt-3.5 mb-0 text-[20px] leading-[1.35] text-(--soft)">
          {current.caption}
        </p>
      )}

      {count > 1 && (
        <div className="mt-3 mb-3 flex flex-wrap items-end justify-between gap-4">
          <span className="font-note text-[22px] leading-none text-(--soft)">
            {moreLabel}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={a11y.previousImage}
              className="r-tag ink-border cursor-pointer bg-(--paper) px-2.5 py-1 text-[13px] leading-[1.2] font-bold"
            >
              ←
            </button>
            <span className="font-tech min-w-[52px] text-center text-[11px] tracking-[0.14em] text-(--soft)">
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(count).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={a11y.nextImage}
              className="r-tag ink-border cursor-pointer bg-(--paper) px-2.5 py-1 text-[13px] leading-[1.2] font-bold"
            >
              →
            </button>
          </div>
        </div>
      )}

      {count > 1 && (
        <div
          ref={thumbsRef}
          role="group"
          aria-label={galleryLabel}
          className="mt-3.5 flex gap-2.5 overflow-x-auto pb-1.5"
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              // `aria-current` menandai thumbnail yang sedang tampil besar —
              // pembedanya bukan cuma warna border yang tak terbaca. Yang tidak
              // aktif dibiarkan tanpa atribut, bukan `aria-current="false"`.
              aria-current={index === active ? "true" : undefined}
              aria-label={fill(a11y.showImage, { n: index + 1 })}
              className={cn(
                "r-chip ink-border relative h-[62px] w-[86px] shrink-0 cursor-pointer overflow-hidden bg-(--wash)",
                index === active
                  ? "border-(--accent-ink)"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="86px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Dialognya dipasang di <body> lewat portal, bukan di tempatnya berada
          di pohon. Galeri ini hidup di dalam #main-content, dan #main-content
          adalah salah satu elemen yang diberi `inert` saat dialog terbuka —
          kalau dialognya tetap jadi keturunannya, ia ikut inert dan tidak bisa
          menerima fokus sama sekali. Portal juga membebaskannya dari konteks
          penumpukan navbar yang sticky. */}
      {zoomed &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={fill(a11y.imageDialog, { title })}
            tabIndex={-1}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-(--paper)/97 p-5 outline-none"
          >
            <div className="relative flex max-h-[78vh] w-full max-w-[1100px] flex-1 items-center justify-center">
              <Image
                src={current.url}
                alt={current.alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {current.caption && (
              <p className="m-0 max-w-[70ch] text-center text-[13px] text-(--soft)">
                {current.caption}
              </p>
            )}

            <div className="flex items-center gap-2.5">
              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label={a11y.previousImage}
                    className="r-tag ink-border lift-chip cursor-pointer bg-(--paper) px-3.5 py-2 text-[13px] font-bold"
                  >
                    ←
                  </button>
                  <span className="font-tech text-[12px] text-(--soft)">
                    {active + 1} / {count}
                  </span>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label={a11y.nextImage}
                    className="r-tag ink-border lift-chip cursor-pointer bg-(--paper) px-3.5 py-2 text-[13px] font-bold"
                  >
                    →
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setZoomed(false)}
                className="r-tag ink-border lift-chip cursor-pointer bg-(--paper) px-4 py-2 text-[12px] font-bold tracking-[0.1em] uppercase"
              >
                {ui.buttons.close}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
