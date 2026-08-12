import { prisma } from "@/lib/prisma";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { date: "desc" },
    include: { translations: { where: { locale: "en" } } },
  });

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-hand text-[34px] leading-none">Manage Projects</h1>
        <span className="text-[12px] text-(--soft)">
          {projects.length} project{projects.length === 1 ? "" : "s"}
        </span>
      </div>

      <p className="r-card ink-border flat-3 mb-4 bg-(--wash) p-4 text-[13px] text-(--soft)">
        Editing is temporarily unavailable while the bilingual project forms are
        rebuilt. The list below is read-only.
      </p>

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
              <span className="text-[14px] font-semibold">
                {project.translations[0]?.title ?? project.slug}
              </span>
              <span className="text-[11px] tracking-[0.1em] text-(--soft) uppercase">
                {project.year}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
