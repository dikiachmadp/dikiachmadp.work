"use client";

import Image from "next/image";
import { useState } from "react";
import Button from "@/components/ui/Button";
import SectionShell from "./SectionShell";
import { cn } from "@/lib/utils";
import type { LocalizedLandingSection } from "@/schemas/product-landing";

type VariantsData = LocalizedLandingSection<"variants">;

/**
 * Pemilih varian. Satu-satunya komponen klien di halaman ini: mengganti
 * pratinjau harus terasa langsung, dan memuat ulang halaman untuk melihat
 * warna berikutnya akan mematikan niat pembaca.
 *
 * Tombol demo hanya dirender untuk varian yang `linkUrl`-nya terisi. Varian
 * tanpa demo tidak menampilkan tombol mati — pembaca tidak pernah mengklik
 * sesuatu yang tidak ke mana-mana.
 */
export default function VariantsSection({
  id,
  section,
  demoLabel,
}: {
  id: string;
  section: VariantsData;
  demoLabel: string;
}) {
  const [active, setActive] = useState(0);
  const variant = section.items[active] ?? section.items[0];

  return (
    <SectionShell id={id} heading={section.heading} intro={section.intro}>
      <div
        role="tablist"
        aria-label={section.heading}
        className="mb-5 flex flex-wrap gap-2.5"
      >
        {section.items.map((item, index) => (
          <button
            key={item.name}
            type="button"
            role="tab"
            aria-selected={index === active}
            onClick={() => setActive(index)}
            className={cn(
              "r-chip ink-border lift-chip flex cursor-pointer items-center gap-2.5 bg-(--paper) px-3.5 py-2 text-[13px] font-semibold",
              index === active && "flat-3",
            )}
          >
            <span
              aria-hidden="true"
              style={{ backgroundColor: item.hex }}
              className="ink-border h-4 w-4 shrink-0 rounded-full"
            />
            {item.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_260px]">
        <div className="r-frame ink-border flat-5 bg-(--wash) p-2.5">
          <div className="r-frame-inner ink-border relative aspect-[16/10] overflow-hidden">
            {variant.image ? (
              <Image
                src={variant.image}
                alt={variant.name}
                fill
                sizes="(max-width: 1024px) 100vw, 700px"
                className="object-contain"
              />
            ) : (
              <span
                style={{ backgroundColor: variant.hex }}
                className="block h-full w-full"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div>
            <div className="micro text-(--soft)">{variant.hex}</div>
            <h3 className="font-hand mt-0.5 mb-0 text-[24px] leading-[1.15]">
              {variant.name}
            </h3>
          </div>
          {variant.description.trim() !== "" && (
            <p className="m-justify m-0 text-[14px] leading-[1.65] text-(--soft)">
              {variant.description}
            </p>
          )}
          {variant.linkUrl !== "" && (
            <Button
              href={variant.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="sm"
              className="r-chip w-fit"
            >
              {demoLabel} ↗
            </Button>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
