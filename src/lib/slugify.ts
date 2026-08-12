/** Kunci kategori stabil, diturunkan dari label bahasa Inggris. */
export function slugifyCategory(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
