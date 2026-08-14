import { notFound } from "next/navigation";
import { updateTestimonialAction } from "../../actions";
import TestimonialForm from "@/components/admin/TestimonialForm";
import { getAllProjectSlugs } from "@/lib/db/projects";
import { getTestimonialById } from "@/lib/db/testimonials";
import { requireUser } from "@/lib/supabase/auth";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireUser(locale);

  const [item, slugs] = await Promise.all([
    getTestimonialById(id),
    getAllProjectSlugs(),
  ]);
  if (!item) notFound();

  return (
    <>
      <h1 className="font-hand mb-5 text-[clamp(1.75rem,5vw,2.125rem)] leading-none">
        Edit testimonial
      </h1>
      <TestimonialForm
        action={updateTestimonialAction.bind(null, item.id)}
        locale={locale}
        values={{
          locale: item.locale,
          name: item.name,
          role: item.role,
          content: item.content,
          avatarUrl: item.avatarUrl ?? "",
          projectRef: item.projectRef ?? "",
          order: String(item.order),
        }}
        projectSlugs={slugs}
        submitLabel="Save changes"
      />
    </>
  );
}
