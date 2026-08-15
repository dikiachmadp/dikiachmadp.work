import { notFound } from "next/navigation";
import { updatePostAction } from "../../actions";
import LogbookForm, {
  emptyLogbookForm,
  type LogbookFormValues,
  type LogbookTranslationValues,
} from "@/components/admin/LogbookForm";
import { getPostForEdit } from "@/lib/db/logbook";
import { toDateTimeLocalUtc } from "@/schemas/admin";
import { requireUser } from "@/lib/supabase/auth";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireUser(locale);

  const post = await getPostForEdit(id);
  if (!post) notFound();

  const translationFor = (lang: "en" | "id"): LogbookTranslationValues => {
    const tr = post.translations.find((t) => t.locale === lang);
    if (!tr) return { slug: "", title: "", excerpt: "", body: "", images: [] };
    return {
      slug: tr.slug,
      title: tr.title,
      excerpt: tr.excerpt,
      body: tr.body,
      images: tr.images.map((image) => ({
        url: image.url,
        alt: image.alt,
        caption: image.caption ?? "",
      })),
    };
  };

  const values: LogbookFormValues = {
    ...emptyLogbookForm,
    status: post.status,
    publishedAt: toDateTimeLocalUtc(post.publishedAt),
    translations: { en: translationFor("en"), id: translationFor("id") },
  };

  const heading =
    values.translations.en.title || values.translations.id.title || "post";

  return (
    <>
      <h1 className="font-hand mb-5 text-[clamp(1.75rem,5vw,2.125rem)] leading-none">
        Edit {heading}
      </h1>
      <LogbookForm
        action={updatePostAction.bind(null, post.id)}
        locale={locale}
        values={values}
        submitLabel="Save changes"
      />
    </>
  );
}
