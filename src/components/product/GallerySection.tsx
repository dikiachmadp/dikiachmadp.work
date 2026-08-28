import Gallery from "@/components/ui/Gallery";
import SectionShell from "./SectionShell";
import type { LocalizedLandingSection } from "@/schemas/product-landing";
import type { UiLabels } from "@/types/content";

type GalleryData = LocalizedLandingSection<"gallery">;

/**
 * Memakai ulang `Gallery` milik Logbook dan Project apa adanya — bentuk
 * `GalleryImage` sudah cocok, lengkap dengan dialog zoom, perangkap fokus, dan
 * navigasi papan ketiknya. Tidak ada galeri kedua yang perlu dirawat.
 */
export default function GallerySection({
  id,
  section,
  ui,
}: {
  id: string;
  section: GalleryData;
  ui: UiLabels;
}) {
  const images = section.items.map((item, index) => ({
    id: item.image,
    url: item.image,
    alt: item.caption || `${section.heading} — ${index + 1}`,
    caption: item.caption || undefined,
  }));

  return (
    <SectionShell id={id} heading={section.heading} intro={section.intro}>
      <Gallery
        images={images}
        title={section.heading}
        ui={ui}
        moreLabel={ui.products.galleryLabel}
      />
    </SectionShell>
  );
}
