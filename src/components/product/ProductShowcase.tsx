"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import NaturalImage from "./NaturalImage";
import ProductLightbox, { type ProductImage } from "./ProductLightbox";
import { cn, fill } from "@/lib/utils";
import type { UiLabels } from "@/types/content";

/**
 * Etalase gambar produk: bingkai besar, deretan thumbnail, dan penghitung.
 *
 * Bedanya dengan galeri halaman lain ada pada bingkainya — di sini bingkai
 * *mengikuti* gambar, bukan sebaliknya. Tangkapan layar tampilan ponsel yang
 * potret akan menyusutkan bingkainya jadi panel jangkung yang ramping alih-alih
 * mengambang kecil di tengah kotak lanskap. Batasnya cuma satu: `72svh`, supaya
 * gambar sejangkung apa pun tidak pernah mendorong kartu beli keluar layar.
 *
 * Thumbnail justru dipaksa persegi dan `object-cover`. Itu bukan
 * ketidakkonsistenan: thumbnail hanya penanda posisi, dan deret persegi jauh
 * lebih mudah dipindai matanya daripada deret berbeda-beda bentuk.
 */
export default function ProductShowcase({
  images,
  title,
  ui,
}: {
  images: ProductImage[];
  title: string;
  ui: UiLabels;
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);

  const t = ui.products;
  const a11y = ui.a11y;
  const count = images.length;

  if (count === 0) {
    return (
      <div className="r-frame ink-border flat-5 bg-(--wash) p-2.5">
        <div className="r-frame-inner ink-border crosshatch flex min-h-[280px] items-center justify-center">
          <span className="font-tech text-[11px] tracking-[0.2em] text-(--soft) uppercase">
            {title}
          </span>
        </div>
      </div>
    );
  }

  const current = images[active];

  return (
    <section aria-label={fill(a11y.imageGallery, { title })}>
      <div className="relative">
        <div className="r-frame ink-border flat-5 bg-(--wash) p-2.5">
          <button
            ref={openerRef}
            type="button"
            onClick={() => setZoomed(true)}
            aria-label={a11y.enlargeImage}
            className="r-frame-inner ink-border block w-full cursor-zoom-in overflow-hidden"
          >
            <NaturalImage
              src={current.url}
              alt={current.alt}
              sizes="(max-width: 1024px) 100vw, 620px"
              priority
              maxHeight="72svh"
              minHeight={280}
            />
          </button>
        </div>

        {count > 1 && (
          <span
            aria-hidden
            className="r-tag ink-border flat-3 font-note absolute -top-4 right-6 rotate-3 bg-(--paper) px-3 pt-0.5 pb-1 text-[19px]"
          >
            {fill(count === 1 ? t.imagesCountOne : t.imagesCount, { count })}
          </span>
        )}
      </div>

      {current.caption && (
        <p className="font-note mt-3.5 mb-0 text-[20px] leading-[1.35] text-(--soft)">
          {current.caption}
        </p>
      )}

      {count > 1 && (
        <div
          role="group"
          aria-label={fill(a11y.imageGallery, { title })}
          className="mt-4 flex gap-2.5 overflow-x-auto pb-1.5"
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-current={index === active ? "true" : undefined}
              aria-label={fill(a11y.showImage, { n: index + 1 })}
              className={cn(
                "r-chip ink-border relative aspect-square w-[68px] shrink-0 cursor-pointer overflow-hidden bg-(--wash) transition-opacity",
                index === active
                  ? "flat-3 border-(--accent-ink)"
                  : "opacity-65 hover:opacity-100",
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="68px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {zoomed && (
        <ProductLightbox
          images={images}
          index={active}
          onIndexChange={setActive}
          onClose={() => setZoomed(false)}
          title={title}
          ui={ui}
          openerRef={openerRef}
        />
      )}
    </section>
  );
}
