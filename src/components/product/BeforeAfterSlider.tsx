"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { fill } from "@/lib/utils";

/**
 * Perbandingan sebelum/sesudah dengan pembagi yang bisa digeser.
 *
 * Dua gambar bersebelahan memaksa pembaca membandingkan sendiri lewat ingatan;
 * satu gambar yang tersingkap di bawah jari membuat perbedaannya terasa
 * seketika. Untuk produk yang seluruh nilainya adalah "tampilannya berubah",
 * itu bukan hiasan — itu argumen penjualannya.
 *
 * Tinggi kotaknya diambil dari rasio asli gambar "sebelum", bukan dari rasio
 * yang dipatok di kode. Perbandingan tampilan ponsel karena itu tampil potret
 * seperti aslinya. Konsekuensinya sepasang gambar yang rasionya tidak sama
 * akan terlihat meleset saat disapu — peringatan itu ditulis di petunjuk form
 * admin (`LANDING_SLOTS.proof.hint`).
 *
 * Bisa dioperasikan penuh dari papan ketik: pembagi ini `role="slider"` dengan
 * `aria-valuenow` yang benar-benar berubah, bukan sekadar sasaran `pointerdown`.
 */
export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel,
  afterLabel,
  title,
  hint,
  sliderLabel,
}: {
  beforeImage: string;
  afterImage: string;
  beforeLabel: string;
  afterLabel: string;
  title: string;
  hint: string;
  /** Templat ber-`{title}` untuk nama aksesibel pembagi. */
  sliderLabel: string;
}) {
  const [pos, setPos] = useState(50);
  const [ratio, setRatio] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const setFromClientX = useCallback((clientX: number) => {
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  }, []);

  const nudge = (delta: number) =>
    setPos((current) => Math.min(100, Math.max(0, current + delta)));

  const measure = (node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalHeight > 0) {
      setRatio(node.naturalWidth / node.naturalHeight);
    }
  };

  return (
    <div>
      {/* Batasnya dipasang lewat *lebar* bingkai, bukan tinggi kotaknya:
          menahan tinggi akan menyisakan pita kosong di kiri-kanan, sedangkan
          menahan lebar membuat bingkainya sendiri menyusut. Tangkapan layar
          ponsel (rasio ~0.32) karena itu tampil sebagai panel jangkung ramping
          seukuran ponsel — bukan kolom setinggi 2.800 piksel yang menelan
          seluruh halaman. */}
      <div
        className="r-frame ink-border flat-5 mx-auto bg-(--wash) p-2.5"
        style={{
          maxWidth: ratio ? `calc(78svh * ${ratio})` : undefined,
        }}
      >
        <div
          ref={boxRef}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
            setFromClientX(event.clientX);
          }}
          onPointerMove={(event) => {
            if (dragging) setFromClientX(event.clientX);
          }}
          onPointerUp={(event) => {
            event.currentTarget.releasePointerCapture(event.pointerId);
            setDragging(false);
          }}
          onPointerCancel={() => setDragging(false)}
          // `touch-none` supaya menyeret pembagi di ponsel tidak ikut
          // menggulirkan halaman di baliknya.
          className="r-frame-inner ink-border relative touch-none overflow-hidden select-none"
          style={{
            aspectRatio: ratio ?? undefined,
            minHeight: ratio ? undefined : 240,
          }}
        >
          <Image
            ref={measure}
            src={beforeImage}
            alt={`${title} — ${beforeLabel}`}
            fill
            sizes="(max-width: 900px) 100vw, 860px"
            onLoad={(event) => {
              const img = event.currentTarget;
              if (img.naturalHeight > 0) {
                setRatio(img.naturalWidth / img.naturalHeight);
              }
            }}
            className="object-contain"
            draggable={false}
          />

          {/* Lapisan "sesudah" ditumpuk utuh lalu dipotong dari kiri, jadi yang
              bergerak hanyalah batas potongannya — gambarnya sendiri tidak
              pernah bergeser, dan sapuannya terasa seperti mengelap kaca. */}
          <div
            className="absolute inset-0"
            style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
          >
            <Image
              src={afterImage}
              alt={`${title} — ${afterLabel}`}
              fill
              sizes="(max-width: 900px) 100vw, 860px"
              className="object-contain"
              draggable={false}
            />
          </div>

          <span className="r-tag ink-border font-tech absolute top-2.5 left-2.5 bg-(--paper)/90 px-2 py-1 text-[10px] font-bold tracking-[0.12em] uppercase">
            {beforeLabel}
          </span>
          <span className="r-tag ink-border font-tech absolute top-2.5 right-2.5 bg-(--paper)/90 px-2 py-1 text-[10px] font-bold tracking-[0.12em] uppercase">
            {afterLabel}
          </span>

          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 w-0.5 bg-(--line)"
            style={{ left: `${pos}%` }}
          />

          <button
            type="button"
            role="slider"
            aria-label={fill(sliderLabel, { title })}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            aria-valuetext={`${Math.round(pos)}%`}
            onKeyDown={(event) => {
              const step =
                event.key === "PageUp" || event.key === "PageDown" ? 10 : 5;
              if (event.key === "ArrowLeft" || event.key === "PageDown") {
                nudge(-step);
              } else if (event.key === "ArrowRight" || event.key === "PageUp") {
                nudge(step);
              } else if (event.key === "Home") {
                setPos(0);
              } else if (event.key === "End") {
                setPos(100);
              } else {
                return;
              }
              // Panah kiri/kanan juga menggulir halaman secara mendatar di
              // sebagian peramban; di sini tugasnya sudah diambil alih.
              event.preventDefault();
            }}
            className="ink-border flat-3 absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-(--paper) text-[15px] font-bold"
            style={{ left: `${pos}%` }}
          >
            <span aria-hidden="true">↔</span>
          </button>
        </div>
      </div>

      <p className="font-note mt-2.5 mb-0 text-center text-[18px] leading-[1.3] text-(--soft)">
        {hint}
      </p>
    </div>
  );
}
