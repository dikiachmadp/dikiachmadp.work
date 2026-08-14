import { createProjectAction } from "../actions";
import ProjectForm, { emptyProjectForm } from "@/components/admin/ProjectForm";
import { getCategoryLabels } from "@/lib/categories";
import { requireUser } from "@/lib/supabase/auth";

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireUser(locale);
  const categories = await getCategoryLabels();

  return (
    <>
      <h1 className="font-hand mb-5 text-[clamp(1.75rem,5vw,2.125rem)] leading-none">
        New project
      </h1>
      <ProjectForm
        action={createProjectAction}
        locale={locale}
        values={emptyProjectForm}
        categories={categories}
        submitLabel="Create project"
      />
    </>
  );
}
