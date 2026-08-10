import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deleteProject } from "./delete-action";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const projects = await prisma.project.findMany();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Manage Projects</h1>
        <Link
          href={`/${locale}/dashboard/projects/new`}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Add New Project
        </Link>
      </div>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border">Title</th>
            <th className="py-2 px-4 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td className="py-2 px-4 border">{project.title}</td>
              <td className="py-2 px-4 border flex gap-2">
                <Link
                  href={`/${locale}/dashboard/projects/${project.id}/edit`}
                  className="text-blue-500 hover:underline"
                >
                  Edit
                </Link>
                <form action={deleteProject.bind(null, project.id)}>
                  <button
                    type="submit"
                    className="text-red-500 hover:underline"
                    onClick={() => confirm("Are you sure?")}
                  >
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
