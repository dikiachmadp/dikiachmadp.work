"use client";

import { useEffect, useState } from "react";

/**
 * Membagikan pos yang sedang dibuka.
 *
 * Web Share API kalau ada (di ponsel itu lembar berbagi asli), kalau tidak
 * salin tautan ke papan klip. Nol backend, nol data pribadi, nol dampak pada
 * ISR — jadi tidak ada tombol pihak ketiga yang menanam skrip pelacak.
 *
 * URL-nya dibaca dari `location` saat diklik, bukan dirakit dari siteConfig:
 * yang dibagikan harus persis halaman yang sedang dilihat, termasuk di preview
 * deploy dan di localhost.
 */
export default function ShareButton({
  title,
  label,
  copiedLabel,
}: {
  title: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  // Konfirmasi "tersalin" kembali ke label semula setelah dua detik.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const share = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Membatalkan lembar berbagi melempar AbortError. Itu bukan kegagalan,
        // jadi jangan tampilkan apa pun — tapi tetap jatuh ke salin-tautan
        // kalau yang gagal adalah API-nya sendiri.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Papan klip butuh konteks aman dan izin; kalau ditolak, diam saja lebih
      // baik daripada pesan error untuk sesuatu yang tidak diminta pengguna.
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="r-btn ink-border flat-3 lift-btn cursor-pointer bg-(--paper) px-5 py-2.5 text-[12px] font-bold tracking-[0.1em] uppercase"
    >
      {/* aria-live supaya perubahan label terbaca pembaca layar — tanpa ini
          konfirmasinya hanya terlihat, dan tombolnya seolah tidak bereaksi. */}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
