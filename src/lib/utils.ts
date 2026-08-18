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
