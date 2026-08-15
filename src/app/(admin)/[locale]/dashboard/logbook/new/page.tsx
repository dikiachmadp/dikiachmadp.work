import { createPostAction } from "../actions";
import LogbookForm, { emptyLogbookForm } from "@/components/admin/LogbookForm";
import { requireUser } from "@/lib/supabase/auth";

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireUser(locale);

  return (
    <>
      <h1 className="font-hand mb-5 text-[clamp(1.75rem,5vw,2.125rem)] leading-none">
        New post
      </h1>
      <LogbookForm
        action={createPostAction}
        locale={locale}
        values={emptyLogbookForm}
        submitLabel="Create post"
      />
    </>
  );
}
