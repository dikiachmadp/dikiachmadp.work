import { createProductAction } from "../actions";
import ProductForm, { emptyProductForm } from "@/components/admin/ProductForm";
import { requireUser } from "@/lib/supabase/auth";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireUser(locale);

  return (
    <>
      <h1 className="font-hand mb-5 text-[clamp(1.75rem,5vw,2.125rem)] leading-none">
        New product
      </h1>
      <ProductForm
        action={createProductAction}
        locale={locale}
        values={emptyProductForm}
        submitLabel="Create product"
      />
    </>
  );
}
