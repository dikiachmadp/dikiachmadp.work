import { notFound } from "next/navigation";
import { updateProjectAction } from "../../actions";
import ProjectForm, {
  emptyProjectForm,
  type ProjectFormValues,
} from "@/components/admin/ProjectForm";
import { getProjectForEdit } from "@/lib/db/projects";
import { requireUser } from "@/lib/supabase/auth";

/** contentBlocks disimpan sebagai JSONB; textarea memakai paragraf berjarak. */
function blocksToText(value: unknown): string {
  return Array.isArray(value)
    ? value.filter((b) => typeof b === "string").join("\n\n")
    : "";
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireUser(locale);

  const project = await getProjectForEdit(id);
  if (!project) notFound();

  const translationFor = (lang: "en" | "id") => {
    const tr = project.translations.find((t) => t.locale === lang);
    return {
      title: tr?.title ?? "",
      client: tr?.client ?? "",
      description: tr?.description ?? "",
      role: tr?.role ?? "",
      duration: tr?.duration ?? "",
      contentBlocks: blocksToText(tr?.contentBlocks),
    };
  };

  const values: ProjectFormValues = {
    ...emptyProjectForm,
    slug: project.slug,
    categoryKey: project.categoryKey,
    year: project.year,
    date: project.date,
    coverImage: project.coverImage,
    logoUrl: project.logoUrl ?? "",
    featured: project.featured,
    liveUrl: project.liveUrl ?? "",
    isLivePreview: project.isLivePreview,
    tags: project.tags.join(", "),
    tools: project.tools.join(", "),
    gallery: project.gallery.join("\n"),
    translations: { en: translationFor("en"), id: translationFor("id") },
  };

  return (
    <>
      <h1 className="font-hand mb-5 text-[clamp(1.75rem,5vw,2.125rem)] leading-none">
        Edit {values.translations.en.title || project.slug}
      </h1>
      <ProjectForm
        action={updateProjectAction.bind(null, project.id)}
        locale={locale}
        values={values}
        submitLabel="Save changes"
      />
    </>
  );
}
