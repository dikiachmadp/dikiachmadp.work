import Image from "next/image";
import Link from "next/link";
import type { DigitalProductSummary } from "@/lib/db/products";
import type { Locale, UiLabels } from "@/types/content";
import Tag from "@/components/ui/Tag";
import { cn, fill, priceLabel } from "@/lib/utils";

interface ProductCardProps {
  product: DigitalProductSummary;
  locale: Locale;
  ui: UiLabels;
  className?: string;
}

/**
 * Kartu katalog produk.
 *
 * Berhenti mencerminkan `ProjectCard`. Keduanya memang bersaudara secara
 * tampilan, tapi tugasnya berbeda: kartu proyek mendokumentasikan pekerjaan,
 * kartu ini menjual barang. Karena itu sampulnya berasio tetap 4:3 dan
 * dipotong `object-cover` alih-alih `object-contain` di kotak 16:10 — deret
 * kartu yang tingginya sama terbaca sebagai rak, sedangkan gambar yang
 * mengambang di kotak dengan tepi kosong berbeda-beda terbaca sebagai daftar
 * tulisan.
 *
 * Satu lencana harga saja, tidak pernah dua: harga di atas nol tampil
 * terformat, harga tepat nol tampil sebagai "Gratis", dan harga yang belum
 * ditetapkan tidak menampilkan lencana sama sekali. Ketiganya keadaan yang
 * berbeda dan `priceLabel()` yang menjaganya tetap berbeda, di sini maupun di
 * kartu beli.
 */
export default function ProductCard({
  product,
  locale,
  ui,
  className,
}: ProductCardProps) {
  const t = ui.products;
  const hasCover = Boolean(product.coverImage);
  const price = priceLabel(
    product.price,
    product.currency,
    locale,
    t.freeLabel,
  );

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className={cn(
        "r-card ink-border flat-3 lift-card block overflow-hidden bg-(--paper)",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b-2 border-(--line) bg-(--wash)",
          !hasCover && "crosshatch",
        )}
      >
        {hasCover ? (
          <Image
            src={product.coverImage}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1180px) 50vw, 376px"
            className="object-cover"
          />
        ) : (
          <span className="font-tech text-[10px] tracking-[0.2em] text-(--soft) uppercase">
            {product.title}
          </span>
        )}
        {price && (
          <span className="r-tag ink-border flat-3 absolute top-2.5 right-2.5 bg-(--paper) px-2.5 py-1 text-[11px] font-bold">
            {price}
          </span>
        )}
      </div>

      <div className="px-[18px] pt-4 pb-[18px]">
        <h3 className="font-hand text-[23px] leading-[1.1]">{product.title}</h3>
        <p className="m-justify mt-1.5 text-[13px] leading-[1.6] text-(--soft)">
          {product.summary}
        </p>

        {product.deliverablesCount > 0 && (
          <p className="font-tech mt-2.5 mb-0 text-[11px] tracking-[0.08em] text-(--soft)">
            {fill(
              product.deliverablesCount === 1
                ? t.deliverablesCountOne
                : t.deliverablesCount,
              { count: product.deliverablesCount },
            )}
          </p>
        )}

        {product.tags.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-[7px]">
            {product.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
