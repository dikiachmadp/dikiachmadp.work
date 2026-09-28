import { notFound } from "next/navigation";
import { updateProductAction } from "../../actions";
import ProductForm, {
  emptyProductForm,
  type ProductFormValues,
  type ProductTranslationValues,
} from "@/components/admin/ProductForm";
import { getProductForEdit } from "@/lib/db/products";
import { toDateTimeLocalUtc } from "@/schemas/admin";
import { productBlocksSchema } from "@/schemas/product-blocks";
import { requireUser } from "@/lib/supabase/auth";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireUser(locale);

  const product = await getProductForEdit(id);
  if (!product) notFound();

  const translationFor = (lang: "en" | "id"): ProductTranslationValues => {
    const tr = product.translations.find((t) => t.locale === lang);
    if (!tr) {
      return { slug: "", title: "", summary: "", body: "", deliverables: "" };
    }
    return {
      slug: tr.slug,
      title: tr.title,
      summary: tr.summary,
      body: tr.body,
      // Disunting sebagai textarea satu butir per baris; server memecahnya
      // lagi dengan splitLines.
      deliverables: tr.deliverables.join("\n"),
    };
  };

  const values: ProductFormValues = {
    ...emptyProductForm,
    status: product.status,
    publishedAt: toDateTimeLocalUtc(product.publishedAt),
    featured: product.featured,
    order: String(product.order),
    price: product.price ? product.price.toString() : "",
    currency: product.currency,
    buyUrl: product.buyUrl ?? "",
    polarProductId: product.polarProductId ?? "",
    pwywEnabled: product.pwywEnabled,
    pwywMinAmount: String(product.pwywMinAmount),
    coverImage: product.coverImage,
    gallery: product.gallery.join("\n"),
    tags: product.tags.join(", "),
    demoUrl: product.demoUrl ?? "",
    // Kolom Json bertipe bebas; bentuk yang tidak dikenali dibuka tanpa blok
    // sama sekali supaya form tetap bisa dibuka dan diperbaiki.
    blocks: productBlocksSchema.safeParse(product.blocks ?? []).data ?? [],
    translations: { en: translationFor("en"), id: translationFor("id") },
  };

  const heading =
    values.translations.en.title || values.translations.id.title || "product";

  return (
    <>
      <h1 className="font-hand mb-5 text-[clamp(1.75rem,5vw,2.125rem)] leading-none">
        Edit {heading}
      </h1>
      <ProductForm
        action={updateProductAction.bind(null, product.id)}
        locale={locale}
        values={values}
        submitLabel="Save changes"
      />
    </>
  );
}
