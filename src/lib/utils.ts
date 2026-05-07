import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Menggabungkan class Tailwind dengan aman menggunakan clsx dan tailwind-merge.
 * Berguna untuk komponen UI yang menerima props className tambahan.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}