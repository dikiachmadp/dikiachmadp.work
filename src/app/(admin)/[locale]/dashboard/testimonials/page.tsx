import Link from "next/link";
import { redirect } from "next/navigation";
import ConfirmSubmitButton from "@/components/interactive/ConfirmSubmitButton";
import Pagination from "@/components/admin/Pagination";
import { getTestimonialsPage } from "@/lib/db/testimonials";
import { pageCount, parsePageParam } from "@/lib/pagination";
import { requireUser } from "@/lib/supabase/auth";
import { deleteTestimonialAction } from "./actions";

const PER_PAGE = 30;

export default async function TestimonialsPage({
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
  const { rows, total } = await getTestimonialsPage({
    page: current,
    perPage: PER_PAGE,
  });

  // Lihat catatan di halaman submissions: halaman di luar jangkauan tampil
  // seperti daftar yang benar-benar kosong.
  const pages = pageCount(total, PER_PAGE);
  if (current > pages) {
    redirect(
      `/${locale}/dashboard/testimonials${pages > 1 ? `?page=${pages}` : ""}`,
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-hand text-[clamp(1.75rem,5vw,2.125rem)] leading-none">
          Testimonials
        </h1>
        <Link
          href={`/${locale}/dashboard/testimonials/new`}
          className="r-btn ink-border flat-3 lift-btn bg-(--accent) px-5 py-2.5 text-[12px] font-bold text-white"
        >
          + New testimonial
        </Link>
      </div>

      <div className="r-card ink-border flat-3 bg-(--paper) p-5">
        {rows.length === 0 ? (
          <p className="m-0 py-6 text-center text-[14px] text-(--soft)">
            No testimonials yet.
          </p>
        ) : (
          rows.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-dashed border-(--line) py-3 last:border-b-0"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[14px] font-semibold">
                  {item.name}
                  <span className="ml-2 font-normal text-(--soft)">
                    {item.role}
                  </span>
                </span>
                <span className="font-tech text-[11px] text-(--soft)">
                  {item.locale} · #{item.order}
                  {item.projectRef ? ` · ${item.projectRef}` : ""}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Link
                  href={`/${locale}/dashboard/testimonials/${item.id}/edit`}
                  className="r-tag ink-border lift-chip px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase"
                >
                  Edit
                </Link>
                <form action={deleteTestimonialAction.bind(null, item.id)}>
                  <input type="hidden" name="formLocale" value={locale} />
                  <input type="hidden" name="page" value={current} />
                  <ConfirmSubmitButton
                    message={`Delete the testimonial from "${item.name}"? This cannot be undone.`}
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
        basePath={`/${locale}/dashboard/testimonials`}
        label="Testimonial pages"
      />
    </>
  );
}
