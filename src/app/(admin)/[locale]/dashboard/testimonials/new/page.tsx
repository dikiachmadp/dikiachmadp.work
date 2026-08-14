import { createTestimonialAction } from "../actions";
import TestimonialForm, {
  emptyTestimonialForm,
} from "@/components/admin/TestimonialForm";
import { getAllProjectSlugs } from "@/lib/db/projects";
import { requireUser } from "@/lib/supabase/auth";

export default async function NewTestimonialPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireUser(locale);
  const slugs = await getAllProjectSlugs();

  return (
    <>
      <h1 className="font-hand mb-5 text-[clamp(1.75rem,5vw,2.125rem)] leading-none">
        New testimonial
      </h1>
      <TestimonialForm
        action={createTestimonialAction}
        locale={locale}
        values={emptyTestimonialForm}
        projectSlugs={slugs}
        submitLabel="Create testimonial"
      />
    </>
  );
}
