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
