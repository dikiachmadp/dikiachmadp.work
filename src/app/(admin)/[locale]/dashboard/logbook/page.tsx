import Link from "next/link";
import { redirect } from "next/navigation";
import ConfirmSubmitButton from "@/components/interactive/ConfirmSubmitButton";
import Pagination from "@/components/admin/Pagination";
import { getLogbookPage } from "@/lib/db/logbook";
import { pageCount, parsePageParam } from "@/lib/pagination";
import { requireUser } from "@/lib/supabase/auth";
import { deletePostAction } from "./actions";

const PER_PAGE = 20;

const dateFormat = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

export default async function LogbookPage({
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
  const { rows, total } = await getLogbookPage({
    page: current,
    perPage: PER_PAGE,
  });

  // Sama seperti halaman lain: halaman di luar jangkauan tampil seperti daftar
  // yang benar-benar kosong, jadi dikembalikan ke halaman terakhir yang ada.
  const pages = pageCount(total, PER_PAGE);
  if (current > pages) {
    redirect(
      `/${locale}/dashboard/logbook${pages > 1 ? `?page=${pages}` : ""}`,
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-hand text-[clamp(1.75rem,5vw,2.125rem)] leading-none">
          Manage Logbook
        </h1>
        <Link
          href={`/${locale}/dashboard/logbook/new`}
          className="r-btn ink-border flat-3 lift-btn bg-(--accent) px-5 py-2.5 text-[12px] font-bold text-white"
        >
          + New post
        </Link>
      </div>

      <div className="r-card ink-border flat-3 bg-(--paper) p-5">
        {rows.length === 0 ? (
          <p className="m-0 py-6 text-center text-[14px] text-(--soft)">
            No posts yet.
          </p>
        ) : (
          rows.map((post) => {
            // Judul EN kalau ada; kalau pos hanya berbahasa Indonesia, judul
            // itulah yang dipakai — bukan id mentah.
            const translation =
              post.translations.find((t) => t.locale === "en") ??
              post.translations[0];
            const title = translation?.title ?? post.id;
            const languages = post.translations
              .map((t) => t.locale.toUpperCase())
              .sort()
              .join(" · ");

            return (
              <div
                key={post.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-dashed border-(--line) py-3 last:border-b-0"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[14px] font-semibold">
                    {title}
                  </span>
                  <span className="font-tech text-[11px] text-(--soft)">
                    {post.status === "PUBLISHED" ? "Published" : "Draft"}
                    {post.publishedAt
                      ? ` · ${dateFormat.format(post.publishedAt)} UTC`
                      : ""}
                    {languages ? ` · ${languages}` : " · no translations"}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Link
                    href={`/${locale}/dashboard/logbook/${post.id}/edit`}
                    className="r-tag ink-border lift-chip px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase"
                  >
                    Edit
                  </Link>
                  <form action={deletePostAction.bind(null, post.id)}>
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
        basePath={`/${locale}/dashboard/logbook`}
        label="Logbook pages"
      />
    </>
  );
}
