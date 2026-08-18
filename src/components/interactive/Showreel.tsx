"use client";

import { useEffect, useRef } from "react";

/**
 * Video showreel di hero.
 *
 * `globals.css` sudah menetralkan animasi di bawah
 * `prefers-reduced-motion: reduce`, tapi aturan CSS itu tidak bisa menyentuh
 * `<video autoplay>` — videonya tetap berputar tanpa henti. Ini satu-satunya
 * gerakan di situs yang menembus preferensi tersebut, jadi dijeda lewat JS.
 *
 * Atribut `autoPlay` sengaja dipertahankan di markup supaya tanpa JavaScript
 * videonya tetap jalan seperti sebelumnya; efek di bawah yang menjedanya lagi
 * bagi yang meminta pengurangan gerak.
 */
export default function Showreel() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = () => {
      const video = ref.current;
      if (!video) return;
      if (media.matches) {
        video.pause();
      } else {
        // Autoplay bisa ditolak browser; itu bukan kondisi yang perlu ditangani.
        void video.play().catch(() => {});
      }
    };

    apply();
    // Preferensinya bisa berubah saat halaman terbuka.
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      // Frame pertama video itu sendiri: mengisi bingkai sejak paint pertama,
      // dan menjadi tampilan tetap bagi yang meminta pengurangan gerak.
      poster="/hero-poster.webp"
      // Only the poster is needed for first paint; without this the whole mp4
      // competes for bandwidth with the hero LCP.
      preload="metadata"
      // Decorative: no controls, no captions, and nothing it conveys is absent
      // from the surrounding copy. Naming it in the accessibility tree without
      // a text alternative would promise more than it delivers.
      aria-hidden
      className="h-full w-full object-cover"
    >
      <source src="/hero-video.mp4" type="video/mp4" />
    </video>
  );
}
