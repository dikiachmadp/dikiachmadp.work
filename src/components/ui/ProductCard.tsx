import Image from "next/image";
import Link from "next/link";
import type { DigitalProductSummary } from "@/lib/db/products";
import type { Locale } from "@/types/content";
import Tag from "@/components/ui/Tag";
import { cn, formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: DigitalProductSummary;
  locale: Locale;
  className?: string;
}

/** Mirrors ProjectCard's shape — same crosshatch fallback, same card chrome. */
export default function ProductCard({
  product,
  locale,
  className,
}: ProductCardProps) {
  const hasCover = Boolean(product.coverImage);
  const price = formatPrice(product.price, product.currency, locale);

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
          "relative flex aspect-[16/10] items-center justify-center overflow-hidden border-b-2 border-(--line) bg-(--wash)",
          !hasCover && "crosshatch",
        )}
      >
        {hasCover ? (
          <Image
            src={product.coverImage}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1180px) 50vw, 376px"
            className="object-contain"
          />
        ) : (
          <span className="font-tech text-[10px] tracking-[0.2em] text-(--soft) uppercase">
            {product.title}
          </span>
        )}
        {price && (
          <span className="r-tag ink-border absolute top-2.5 right-2.5 bg-(--paper) px-2.5 py-1 text-[11px] font-bold">
            {price}
          </span>
        )}
      </div>

      <div className="px-[18px] pt-4 pb-[18px]">
        <h3 className="font-hand text-[23px] leading-[1.1]">{product.title}</h3>
        <p className="m-justify mt-1.5 text-[13px] leading-[1.6] text-(--soft)">
          {product.summary}
        </p>

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
