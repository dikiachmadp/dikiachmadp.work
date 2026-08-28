import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const themeTransition = "transition-colors duration-500 ease-in-out";

/**
 * Fills `{placeholder}` slots in a dictionary string.
 *
 * A handful of accessible names read as one phrase but need a value spliced in
 * ("{category} cover"), and the word order is not the same in both languages —
 * Indonesian puts it the other way round ("Sampul {category}"). Concatenating
 * in the component would lock in English order, so the whole sentence lives in
 * the JSON and the value goes in here.
 *
 * An unknown key is left as-is rather than blanked: a visible `{oops}` in an
 * alt attribute is a bug you can find, an empty string is not.
 */
export function fill(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}

/**
 * Rough reading time from a word count, rounded to whole minutes and floored
 * at 1 — a one-paragraph post reading "0 min" looks broken, not honest.
 * 200 wpm is the commonly cited average for adult silent reading; precision
 * beyond that is not the point of a badge like this.
 */
export function estimateReadingMinutes(
  text: string,
  wordsPerMinute = 200,
): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 1;
  return Math.max(1, Math.round(words / wordsPerMinute));
}

/**
 * `price` is a `Decimal` serialized to string by the DAL (see
 * lib/db/products.ts) — Prisma's `Decimal` type must not leak into a Client
 * Component prop. `null` means "price not published" and is left to the
 * caller to hide, not turned into a misleading "Free" here.
 */
export function formatPrice(
  price: string | null,
  currency: string,
  locale: "en" | "id",
): string | null {
  if (!price) return null;
  const amount = Number(price);
  if (!Number.isFinite(amount)) return null;

  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/**
 * Memformat nominal transaksi yang datang dari Polar.
 *
 * Polar mengirim setiap nominal dalam satuan terkecil mata uangnya — termasuk
 * untuk rupiah, yang di dunia nyata tidak punya sen: Rp149.000 tiba sebagai
 * 14.900.000. Karena itu pembaginya selalu 100, dan `minimumFractionDigits`
 * dibiarkan ditentukan `Intl` supaya rupiah tidak berakhir sebagai "Rp149.000,00".
 *
 * Berbeda dari `formatPrice`, yang memformat harga katalog dari kolom Decimal.
 */
export function formatCents(
  amount: number,
  currency: string,
  locale: "en" | "id",
): string {
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}
