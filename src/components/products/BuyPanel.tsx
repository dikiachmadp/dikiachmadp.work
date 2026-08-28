"use client";

import { useTheme } from "next-themes";
import { useState } from "react";
import Button from "@/components/ui/Button";
import type { Locale, UiLabels } from "@/types/content";
import { cn, formatPrice } from "@/lib/utils";

/** Sen. Sengaja dijaga sama dengan TIP_PRESETS di src/lib/polar.ts. */
const PRESETS = [0, 300, 500, 1000];

type Status = "idle" | "loading" | "error";

interface BuyPanelProps {
  slug: string;
  locale: Locale;
  labels: UiLabels["products"];
  /** `null` berarti produk ini belum dijual lewat Polar. */
  polarProductId: string | null;
  buyUrl: string | null;
  pwywEnabled: boolean;
  /** Sen. */
  pwywMinAmount: number;
}

export default function BuyPanel({
  slug,
  locale,
  labels,
  polarProductId,
  buyUrl,
  pwywEnabled,
  pwywMinAmount,
}: BuyPanelProps) {
  const { resolvedTheme } = useTheme();
  const [status, setStatus] = useState<Status>("idle");
  const [selected, setSelected] = useState<number>(pwywMinAmount);
  const [custom, setCustom] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  /**
   * Produk yang belum punya padanan di Polar tetap memakai tombol lama apa
   * adanya. Ini yang membuat katalog Gumroad yang sudah terbit tidak perlu
   * disentuh sama sekali saat fitur ini menyala.
   */
  if (!polarProductId) {
    if (!buyUrl) return null;
    return (
      <Button
        href={buyUrl}
        target="_blank"
        variant="primary"
        size="sm"
        fullWidth
        className="r-chip py-[11px] text-[13px]"
      >
        {labels.buyBtn} ↗
      </Button>
    );
  }

  const presets = PRESETS.filter((amount) => amount >= pwywMinAmount);
  const customCents = Math.round(Number(custom) * 100);
  const amount = isCustom
    ? Number.isFinite(customCents)
      ? customCents
      : pwywMinAmount
    : selected;
  // Nominal di bawah batas bawah ditahan di sini, sebelum request dikirim —
  // Polar akan menolaknya juga, tapi jauh belakangan dan dengan pesan yang
  // tidak berarti apa-apa bagi pembeli.
  const belowMinimum = amount < pwywMinAmount;

  const openCheckout = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          locale,
          ...(pwywEnabled && { amount }),
        }),
      });
      if (!res.ok) throw new Error(`Checkout responded ${res.status}`);

      const { url } = (await res.json()) as { url: string };

      /**
       * Import dinamis, bukan statis: paket embed menyentuh `document` saat
       * dimuat, jadi ia tidak boleh ikut terbawa ke bundel yang dievaluasi saat
       * prerender. Sekalian membuatnya baru diunduh ketika orang benar-benar
       * menekan tombol.
       */
      const { PolarEmbedCheckout } = await import("@polar-sh/checkout/embed");
      await PolarEmbedCheckout.create(url, {
        theme: resolvedTheme === "dark" ? "dark" : "light",
      });
      setStatus("idle");
    } catch (error) {
      console.error("Embedded checkout failed:", error);
      setStatus("error");
    }
  };

  const label =
    pwywEnabled && amount > 0
      ? `${labels.payBtn} ${formatPrice((amount / 100).toString(), "USD", locale)}`
      : labels.getFreeBtn;

  return (
    <div className="flex flex-col gap-3">
      {pwywEnabled && (
        <>
          <p className="m-0 text-[13px] leading-[1.55] text-(--soft)">
            {labels.tipPrompt}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setIsCustom(false);
                  setSelected(preset);
                }}
                className={cn(
                  "r-chip ink-border cursor-pointer px-3 py-[7px] text-[12px] font-bold",
                  !isCustom && selected === preset
                    ? "bg-(--accent) text-white"
                    : "bg-(--wash)",
                )}
              >
                {preset === 0 ? labels.freeLabel : `$${preset / 100}`}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={cn(
                "r-chip ink-border cursor-pointer px-3 py-[7px] text-[12px] font-bold",
                isCustom ? "bg-(--accent) text-white" : "bg-(--wash)",
              )}
            >
              {labels.tipCustom}
            </button>
          </div>

          {isCustom && (
            <input
              type="number"
              min={pwywMinAmount / 100}
              step="1"
              inputMode="decimal"
              aria-label={labels.tipCustomLabel}
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              className="ink-border w-full bg-(--wash) px-[15px] py-2.5 text-[14px] outline-none"
            />
          )}
        </>
      )}

      <Button
        onClick={openCheckout}
        disabled={status === "loading" || belowMinimum}
        variant="primary"
        size="sm"
        fullWidth
        className="r-chip py-[11px] text-[13px]"
      >
        {label}
      </Button>

      {status === "error" && (
        <p
          role="alert"
          className="m-0 text-[12px] font-bold text-(--accent-ink)"
        >
          {labels.checkoutError}
        </p>
      )}
    </div>
  );
}
