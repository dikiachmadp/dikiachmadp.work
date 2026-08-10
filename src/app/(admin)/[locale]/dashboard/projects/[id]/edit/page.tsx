import { prisma } from "@/lib/prisma";
import { updateProject } from "./actions";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Project</h1>
      <form action={updateProject.bind(null, id)} className="flex flex-col gap-4">
        <input name="title" defaultValue={project.title} required className="border p-2 rounded" />
        <input name="slug" defaultValue={project.slug} required className="border p-2 rounded" />
        <textarea name="description" defaultValue={project.description} required className="border p-2 rounded" />
        <input name="imageUrl" defaultValue={project.imageUrl} required className="border p-2 rounded" />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Update Project
        </button>
      </form>
    </div>
  );
}
