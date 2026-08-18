import { notFound } from "next/navigation";
import { updateAboutEntryAction } from "../../actions";
import AboutEntryForm from "@/components/admin/AboutEntryForm";
import { getAboutEntryById } from "@/lib/db/about";
import { requireUser } from "@/lib/supabase/auth";

export default async function EditAboutEntryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireUser(locale);

  const item = await getAboutEntryById(id);
  if (!item) notFound();

  return (
    <>
      <h1 className="font-hand mb-5 text-[clamp(1.75rem,5vw,2.125rem)] leading-none">
        Edit entry
      </h1>
      <AboutEntryForm
        action={updateAboutEntryAction.bind(null, item.id)}
        locale={locale}
        values={{
          kind: item.kind,
          locale: item.locale,
          order: String(item.order),
          year: item.year,
          title: item.title,
          subtitle: item.subtitle,
          url: item.url ?? "",
        }}
        submitLabel="Save changes"
      />
    </>
  );
}
