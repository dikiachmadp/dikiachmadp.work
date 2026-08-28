"use client";

import { useRef, useState } from "react";
import NaturalImage from "./NaturalImage";
import ProductLightbox, { type ProductImage } from "./ProductLightbox";
import { cn, fill } from "@/lib/utils";
import type { UiLabels } from "@/types/content";

/**
 * Galeri milik halaman jualan.
 *
 * Sengaja bukan `ui/Gallery`. Galeri itu menampilkan satu gambar besar berasio
 * tetap plus deret thumbnail — bentuk yang tepat untuk *menelusuri* dokumentasi
 * satu per satu, dan bentuk yang salah untuk *memamerkan* barang: pembeli ingin
 * melihat sebanyak mungkin sekaligus lalu memperbesar yang menarik perhatiannya.
 *
 * Karena itu di sini gambar pertama tampil besar sebagai etalase depan, dan
 * sisanya jatuh ke masonry kolom CSS. Tidak ada rasio yang dipaksakan: tangkapan
 * layar potret, lanskap, dan yang memanjang berdiri berdampingan pada bentuk
 * aslinya masing-masing. `break-inside-avoid` yang menjaga tidak ada kartu
 * terbelah antar kolom.
 */
export default function ProductGalleryShowcase({
  images,
  title,
  ui,
}: {
  images: ProductImage[];
  title: string;
  ui: UiLabels;
}) {
  const [zoomed, setZoomed] = useState<number | null>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  if (images.length === 0) return null;

  const [featured, ...rest] = images;

  const open = (index: number, node: HTMLButtonElement | null) => {
    openerRef.current = node;
    setZoomed(index);
  };

  return (
    <div>
      <button
        type="button"
        onClick={(event) => open(0, event.currentTarget)}
        aria-label={ui.a11y.enlargeImage}
        className="r-frame ink-border flat-5 lift-card-sm block w-full cursor-zoom-in bg-(--wash) p-2.5"
      >
        <span className="r-frame-inner ink-border block overflow-hidden">
          <NaturalImage
            src={featured.url}
            alt={featured.alt}
            sizes="(max-width: 980px) 100vw, 940px"
            maxHeight="70svh"
            minHeight={260}
          />
        </span>
        {featured.caption && (
          <span className="font-note mt-2.5 block text-[19px] leading-[1.3] text-(--soft)">
            {featured.caption}
          </span>
        )}
      </button>

      {rest.length > 0 && (
        <div className="mt-5 gap-4 sm:columns-2 lg:columns-3">
          {rest.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={(event) => open(index + 1, event.currentTarget)}
              aria-label={fill(ui.a11y.showImage, { n: index + 2 })}
              className={cn(
                "ink-border mb-4 block w-full cursor-zoom-in overflow-hidden bg-(--paper) p-2",
                // Bentuk dan arah putar berselang-seling supaya kartu
                // bertetangga tidak pernah bersiluet sama — kebiasaan yang
                // sudah dipakai PostCard dan StatBox.
                index % 2 === 0
                  ? "r-card lift-card-sm"
                  : "r-card-alt lift-card-sm-cw",
                "break-inside-avoid",
              )}
            >
              <span className="r-frame-inner ink-border block overflow-hidden">
                <NaturalImage
                  src={image.url}
                  alt={image.alt}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                  minHeight={140}
                />
              </span>
              {image.caption && (
                <span
                  className={cn(
                    "font-note mt-2 block text-[17px] leading-[1.3] text-(--soft)",
                    index % 2 === 0 ? "rotate-[-0.8deg]" : "rotate-[0.6deg]",
                  )}
                >
                  {image.caption}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {zoomed !== null && (
        <ProductLightbox
          images={images}
          index={zoomed}
          onIndexChange={setZoomed}
          onClose={() => setZoomed(null)}
          title={title}
          ui={ui}
          openerRef={openerRef}
        />
      )}
    </div>
  );
}
