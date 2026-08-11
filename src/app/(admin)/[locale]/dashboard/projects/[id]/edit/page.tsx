import { prisma } from "@/lib/prisma";
import AdminForm from "@/components/ui/AdminForm";
import { updateProject } from "./actions";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) {
    return (
      <p className="ink-border-dashed r-chip px-5 py-8 text-center text-[14px] text-(--soft)">
        Project not found
      </p>
    );
  }

  return (
    <AdminForm
      title="Edit Project"
      submitLabel="Update project"
      action={updateProject.bind(null, id)}
      defaults={{
        title: project.title,
        slug: project.slug,
        description: project.description,
        imageUrl: project.imageUrl,
      }}
    />
  );
}
