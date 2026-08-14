import Link from "next/link";
import { redirect } from "next/navigation";
import ConfirmSubmitButton from "@/components/interactive/ConfirmSubmitButton";
import Pagination from "@/components/admin/Pagination";
import { getProjectsPage } from "@/lib/db/projects";
import { pageCount, parsePageParam } from "@/lib/pagination";
import { requireUser } from "@/lib/supabase/auth";
import { deleteProjectAction } from "./actions";

const PER_PAGE = 20;

export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { locale } = await params;
  const { page } = await searchParams;
  await requireUser(locale);

  const current = parsePageParam(page);
  const { rows, total } = await getProjectsPage({
    page: current,
    perPage: PER_PAGE,
  });

  // Lihat catatan di halaman submissions: halaman di luar jangkauan tampil
  // seperti daftar yang benar-benar kosong.
  const pages = pageCount(total, PER_PAGE);
  if (current > pages) {
    redirect(
      `/${locale}/dashboard/projects${pages > 1 ? `?page=${pages}` : ""}`,
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-hand text-[34px] leading-none">Manage Projects</h1>
        <Link
          href={`/${locale}/dashboard/projects/new`}
          className="r-btn ink-border flat-3 lift-btn bg-(--accent) px-5 py-2.5 text-[12px] font-bold text-white"
        >
          + New project
        </Link>
      </div>

      <div className="r-card ink-border flat-3 bg-(--paper) p-5">
        {rows.length === 0 ? (
          <p className="m-0 py-6 text-center text-[14px] text-(--soft)">
            No projects yet.
          </p>
        ) : (
          rows.map((project) => {
            const title = project.translations[0]?.title ?? project.slug;
            return (
              <div
                key={project.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-dashed border-(--line) py-3 last:border-b-0"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[14px] font-semibold">
                    {title}
                  </span>
                  <span className="font-tech text-[11px] text-(--soft)">
                    {project.slug} · {project.date}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Link
                    href={`/${locale}/dashboard/projects/${project.id}/edit`}
                    className="r-tag ink-border lift-chip px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase"
                  >
                    Edit
                  </Link>
                  <form action={deleteProjectAction.bind(null, project.id)}>
                    <input type="hidden" name="formLocale" value={locale} />
                    <input type="hidden" name="page" value={current} />
                    <ConfirmSubmitButton
                      message={`Delete "${title}"? This cannot be undone.`}
                      className="r-tag ink-border lift-chip px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] text-(--soft) uppercase"
                    >
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </span>
              </div>
            );
          })
        )}
      </div>

      <Pagination
        current={current}
        total={total}
        perPage={PER_PAGE}
        basePath={`/${locale}/dashboard/projects`}
        label="Project pages"
      />
    </>
  );
}
