import Link from "next/link";
import { redirect } from "next/navigation";
import ConfirmSubmitButton from "@/components/interactive/ConfirmSubmitButton";
import Pagination from "@/components/ui/Pagination";
import { getAboutEntriesPage } from "@/lib/db/about";
import { pageCount, parsePageParam } from "@/lib/pagination";
import { requireUser } from "@/lib/supabase/auth";
import { deleteAboutEntryAction } from "./actions";

const PER_PAGE = 30;

const KIND_LABEL: Record<string, string> = {
  EXPERIENCE: "Experience",
  CERTIFICATION: "Certification",
};

export default async function AboutEntriesPage({
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
  const { rows, total } = await getAboutEntriesPage({
    page: current,
    perPage: PER_PAGE,
  });

  const pages = pageCount(total, PER_PAGE);
  if (current > pages) {
    redirect(
      `/${locale}/dashboard/about/entries${pages > 1 ? `?page=${pages}` : ""}`,
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-hand text-[clamp(1.75rem,5vw,2.125rem)] leading-none">
          Experience & certifications
        </h1>
        <Link
          href={`/${locale}/dashboard/about/entries/new`}
          className="r-btn ink-border flat-3 lift-btn bg-(--accent) px-5 py-2.5 text-[12px] font-bold text-white"
        >
          + New entry
        </Link>
      </div>

      <div className="r-card ink-border flat-3 bg-(--paper) p-5">
        {rows.length === 0 ? (
          <p className="m-0 py-6 text-center text-[14px] text-(--soft)">
            No entries yet.
          </p>
        ) : (
          rows.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-dashed border-(--line) py-3 last:border-b-0"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[14px] font-semibold">
                  {item.title}
                  <span className="ml-2 font-normal text-(--soft)">
                    {item.subtitle}
                  </span>
                </span>
                <span className="font-tech text-[11px] text-(--soft)">
                  {KIND_LABEL[item.kind] ?? item.kind} · {item.locale} · #
                  {item.order} · {item.year}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Link
                  href={`/${locale}/dashboard/about/entries/${item.id}/edit`}
                  className="r-tag ink-border lift-chip px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase"
                >
                  Edit
                </Link>
                <form action={deleteAboutEntryAction.bind(null, item.id)}>
                  <input type="hidden" name="formLocale" value={locale} />
                  <input type="hidden" name="page" value={current} />
                  <ConfirmSubmitButton
                    message={`Delete "${item.title}"? This cannot be undone.`}
                    className="r-tag ink-border lift-chip px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] text-(--soft) uppercase"
                  >
                    Delete
                  </ConfirmSubmitButton>
                </form>
              </span>
            </div>
          ))
        )}
      </div>

      <Pagination
        current={current}
        total={total}
        perPage={PER_PAGE}
        basePath={`/${locale}/dashboard/about/entries`}
        label="Entry pages"
      />
    </>
  );
}
