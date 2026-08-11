import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ConfirmSubmitButton from "@/components/interactive/ConfirmSubmitButton";
import { deleteProject } from "./delete-action";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-hand text-[34px] leading-none">Manage Projects</h1>
        <Link
          href={`/${locale}/dashboard/projects/new`}
          className="ink-border flat-3 lift-btn bg-(--accent) px-5 py-2.5 text-[12px] font-bold text-white"
          style={{ borderRadius: "22px 9px 24px 10px / 10px 24px 9px 22px" }}
        >
          + New project
        </Link>
      </div>

      <div className="r-card ink-border flat-3 bg-(--paper) p-5">
        {projects.length === 0 ? (
          <p className="m-0 py-6 text-center text-[14px] text-(--soft)">
            No projects yet.
          </p>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-dashed border-(--line) py-3 last:border-b-0"
            >
              <span className="text-[14px] font-semibold">{project.title}</span>
              <span className="flex items-center gap-2">
                <Link
                  href={`/${locale}/dashboard/projects/${project.id}/edit`}
                  className="r-tag ink-border lift-chip px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                >
                  Edit
                </Link>
                <form action={deleteProject.bind(null, project.id)}>
                  <ConfirmSubmitButton
                    message={`Delete "${project.title}"? This cannot be undone.`}
                    className="r-tag ink-border lift-chip px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-(--soft)"
                  >
                    Delete
                  </ConfirmSubmitButton>
                </form>
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
