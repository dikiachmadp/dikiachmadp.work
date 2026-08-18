import { createAboutEntryAction } from "../actions";
import AboutEntryForm, {
  emptyAboutEntryForm,
} from "@/components/admin/AboutEntryForm";
import { requireUser } from "@/lib/supabase/auth";

export default async function NewAboutEntryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireUser(locale);

  return (
    <>
      <h1 className="font-hand mb-5 text-[clamp(1.75rem,5vw,2.125rem)] leading-none">
        New entry
      </h1>
      <AboutEntryForm
        action={createAboutEntryAction}
        locale={locale}
        values={emptyAboutEntryForm}
        submitLabel="Create entry"
      />
    </>
  );
}
