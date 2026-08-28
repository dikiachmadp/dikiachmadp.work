"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Gambar yang tingginya ditentukan gambar itu sendiri.
 *
 * Halaman detail produk sengaja tidak memakai rasio tetap seperti galeri
 * Project dan Logbook: tangkapan layar tampilan ponsel itu potret, tangkapan
 * layar arsip jurnal itu panjang, dan memaksa keduanya ke kotak 16:9 membuat
 * halaman jualan terlihat seperti dokumentasi. Di sini yang dikunci hanya
 * batas atasnya, bukan bentuknya.
 *
 * URL Supabase tidak membawa dimensi, jadi `fill` — yang menuntut kotak
 * berukuran tetap — tidak bisa dipakai apa adanya. Rasionya diukur dari
 * gambarnya sendiri saat dimuat, lalu dipasang sebagai `aspect-ratio` pada
 * pembungkusnya. Sesudah itu `object-contain` tidak menyisakan pita kosong
 * sama sekali: kotaknya memang sudah sebentuk gambarnya.
 *
 * `maxHeight` membatasi lewat *lebar* (`maxWidth = tinggi × rasio`), bukan
 * lewat tinggi. Mengunci tingginya akan menyisakan pita di kiri-kanan; mengunci
 * lebarnya membuat bingkainya sendiri yang menyusut — gambar potret jadi panel
 * jangkung yang ramping, bukan gambar kecil di tengah lapangan kosong.
 */
export default function NaturalImage({
  src,
  alt,
  sizes,
  priority,
  maxHeight,
  minHeight = 220,
  className,
  imageClassName,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** Satuan CSS apa pun, mis. "72svh". Pakai `svh`, bukan `vh` — bilah alamat
   *  peramban ponsel membuat `vh` melebihi layar yang benar-benar terlihat. */
  maxHeight?: string;
  /** Menahan pergeseran tata letak selama rasionya belum diketahui. */
  minHeight?: number;
  className?: string;
  imageClassName?: string;
}) {
  const [ratio, setRatio] = useState<number | null>(null);

  /**
   * Ref callback, bukan `onLoad` saja: gambar yang sudah ada di singgahan
   * peramban bisa selesai dimuat sebelum React sempat memasang penanganya, dan
   * `onLoad` untuk gambar itu tidak pernah berbunyi. `complete` menangkap kasus
   * itu; `onLoad` menangani sisanya.
   */
  const measure = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalHeight > 0) {
      setRatio(node.naturalWidth / node.naturalHeight);
    }
  }, []);

  return (
    <div
      className={cn("relative mx-auto w-full bg-(--wash)", className)}
      style={{
        aspectRatio: ratio ?? undefined,
        minHeight: ratio ? undefined : minHeight,
        maxWidth:
          ratio && maxHeight ? `calc(${maxHeight} * ${ratio})` : undefined,
      }}
    >
      <Image
        ref={measure}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onLoad={(event) => {
          const img = event.currentTarget;
          if (img.naturalHeight > 0) {
            setRatio(img.naturalWidth / img.naturalHeight);
          }
        }}
        className={cn("object-contain", imageClassName)}
      />
    </div>
  );
}
