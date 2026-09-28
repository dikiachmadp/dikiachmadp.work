"use client";

import Image from "next/image";
import { useState } from "react";
import Button from "@/components/ui/Button";
import SectionShell, { type SectionTone } from "./SectionShell";
import { cn } from "@/lib/utils";
import type { LocalizedBlockOf } from "@/schemas/product-blocks";

/**
 * Pemilih varian. Satu-satunya komponen klien di halaman ini: mengganti
 * pratinjau harus terasa langsung, dan memuat ulang halaman untuk melihat
 * warna berikutnya akan mematikan niat pembaca.
 *
 * Tombol demo hanya dirender untuk varian yang `linkUrl`-nya terisi. Varian
 * tanpa demo tidak menampilkan tombol mati — pembaca tidak pernah mengklik
 * sesuatu yang tidak ke mana-mana.
 *
 * Aturan yang sama berlaku untuk warnanya: `hex` boleh kosong, dan varian yang
 * mengosongkannya tidak mendapat kotak warna sama sekali — bukan kotak hitam
 * bawaan yang berbohong. Nama, keterangan, dan gambarnya yang membawanya.
 */
export default function VariantsSection({
  block,
  demoLabel,
  tone,
}: {
  block: LocalizedBlockOf<"variants">;
  demoLabel: string;
  tone?: SectionTone;
}) {
  const [active, setActive] = useState(0);
  const variant = block.items[active] ?? block.items[0];

  return (
    <SectionShell
      id={block.id}
      heading={block.heading}
      intro={block.intro}
      tone={tone}
    >
      <div
        role="tablist"
        aria-label={block.heading}
        className="mb-5 flex flex-wrap gap-2.5"
      >
        {block.items.map((item, index) => (
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
            {item.hex !== "" && (
              <span
                aria-hidden="true"
                style={{ backgroundColor: item.hex }}
                className="ink-border h-4 w-4 shrink-0 rounded-full"
              />
            )}
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
            ) : variant.hex !== "" ? (
              <span
                style={{ backgroundColor: variant.hex }}
                className="block h-full w-full"
              />
            ) : (
              // Tanpa gambar dan tanpa warna, panel arsir yang sama dengan
              // penampung kosong lain di situs ini.
              <span className="crosshatch block h-full w-full" />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div>
            {variant.hex !== "" && (
              <div className="micro text-(--soft)">{variant.hex}</div>
            )}
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
