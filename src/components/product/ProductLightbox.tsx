"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef } from "react";
import type { UiLabels } from "@/types/content";
import { fill } from "@/lib/utils";

export type ProductImage = {
  id: string;
  url: string;
  alt: string;
  caption?: string;
};

/**
 * Dialog zoom milik halaman detail produk.
 *
 * Sengaja bukan `ui/Gallery`: galeri itu melayani Project dan Logbook, yang
 * mendokumentasikan pekerjaan di dalam bingkai berasio tetap. Halaman ini
 * menjual barang, dan calon pembeli harus bisa melihat tangkapan layarnya utuh
 * — potret setinggi layar sekalipun. Yang ditiru dari sana hanya kontrak
 * aksesibilitasnya, bukan tampilannya: `role="dialog"` + `aria-modal`, portal
 * ke <body>, `inert` pada isi di belakangnya, Escape menutup, panah berpindah,
 * fokus kembali ke pemicu. Meniru pola alih-alih kodenya memang kebiasaan repo
 * ini — `Gallery.tsx` sendiri meniru pola dialog dari `MobileMenu.tsx`.
 *
 * Gambarnya dibatasi `92svh`/`94vw` dan bukan dipaksa ke suatu bentuk, jadi
 * gambar potret tampil jangkung dan gambar panjang tampil melebar.
 */
export default function ProductLightbox({
  images,
  index,
  onIndexChange,
  onClose,
  title,
  ui,
  /** Tombol yang membuka dialog; fokus dikembalikan ke sini saat ditutup. */
  openerRef,
}: {
  images: ProductImage[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
  title: string;
  ui: UiLabels;
  openerRef: React.RefObject<HTMLElement | null>;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const a11y = ui.a11y;
  const count = images.length;

  const step = useCallback(
    (delta: number) => onIndexChange((index + delta + count) % count),
    [index, count, onIndexChange],
  );

  useEffect(() => {
    // Ditangkap saat dialog dibuka, bukan dibaca saat pembersihan: yang harus
    // menerima fokus kembali adalah tombol yang membukanya.
    const opener = openerRef.current;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (count < 2) return;
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    // Dialognya menutupi seluruh layar, jadi semuanya kecuali dialog itu
    // sendiri jadi inert — tanpa ini Tab berjalan keluar dialog ke halaman yang
    // tidak bisa dilihat pengguna.
    const behind = [
      document.getElementById("main-content"),
      document.getElementById("site-nav"),
      document.querySelector("footer"),
      document.querySelector(".skip-link"),
      // Bilah beli juga dipasang di <body> lewat portal, jadi ia tidak ikut
      // ter-inert lewat #main-content seperti isi halaman lainnya.
      document.getElementById("sticky-buy"),
    ].filter((el): el is HTMLElement => el !== null);
    behind.forEach((el) => el.setAttribute("inert", ""));

    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      behind.forEach((el) => el.removeAttribute("inert"));
      const focused = document.activeElement;
      if (!focused || focused === document.body) opener?.focus();
    };
  }, [count, step, onClose, openerRef]);

  const current = images[index];

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={fill(a11y.imageDialog, { title })}
      tabIndex={-1}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-(--paper)/97 p-5 outline-none"
    >
      {/* Tidak ada `fill` dan tidak ada kotak berasio tetap: gambarnya sendiri
          yang menentukan bentuknya, dibatasi tinggi dan lebar layar saja. */}
      <Image
        src={current.url}
        alt={current.alt}
        width={2000}
        height={2000}
        sizes="94vw"
        className="ink-border h-auto max-h-[92svh] w-auto max-w-[94vw] object-contain"
        style={{ height: "auto", width: "auto" }}
      />

      {current.caption && (
        <p className="font-note m-0 max-w-[70ch] text-center text-[18px] leading-[1.35] text-(--soft)">
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
              className="r-tag ink-border cursor-pointer bg-(--paper) px-2.5 py-1 text-[13px] leading-[1.2] font-bold"
            >
              ←
            </button>
            <span className="font-tech min-w-[52px] text-center text-[11px] tracking-[0.14em] text-(--soft)">
              {String(index + 1).padStart(2, "0")} /{" "}
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
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          className="r-chip ink-border flat-3 lift-chip cursor-pointer bg-(--paper) px-4 py-1.5 text-[12px] font-bold"
        >
          {ui.buttons.close}
        </button>
      </div>
    </div>,
    document.body,
  );
}
