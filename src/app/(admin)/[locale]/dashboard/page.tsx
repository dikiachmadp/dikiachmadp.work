import { getDictionary } from "@/lib/dictionary";
import { getSubmissionsPage } from "@/lib/db/contact";
import { getProjects } from "@/lib/db/projects";
import { getDashboardStats } from "@/lib/db/stats";
import { Locale } from "@/types/content";
import { cn } from "@/lib/utils";

interface InboxMessage {
  id: string;
  name: string;
  createdAt: Date;
  message: string;
}

/**
 * The inbox is the only part of the dashboard that needs the database. When it
 * is unreachable the rest of the page still renders.
 */
async function loadInbox(): Promise<InboxMessage[] | null> {
  try {
    const { rows } = await getSubmissionsPage({ page: 1, perPage: 3 });
    return rows;
  } catch {
    return null;
  }
}

function relativeAge(date: Date) {
  const hours = Math.max(
    1,
    Math.round((Date.now() - date.getTime()) / 3_600_000),
  );
  return hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const [dict, projects, counts, inbox] = await Promise.all([
    getDictionary(validLocale),
    getProjects(validLocale),
    getDashboardStats(),
    loadInbox(),
  ]);
  const admin = dict.ui.admin;

  const stats = [
    { value: String(counts.projects), label: admin.stats[0] },
    {
      value: String(projects.filter((p) => p.featured).length),
      label: admin.stats[1],
    },
    { value: String(counts.submissions), label: admin.stats[2] },
    { value: String(counts.testimonials), label: admin.stats[3] },
  ];

  // getProjects sudah mengurutkan berdasarkan date desc.
  const recent = projects.slice(0, 5);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-note text-[20px] text-(--soft)">
            {admin.greeting}
          </div>
          <h1 className="font-hand text-[34px] leading-none">
            {admin.dashboard}
          </h1>
        </div>
        {/* Tombol "new project" kembali di Fase 5 bersama form bilingualnya. */}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="ink-border flat-3 lift-btn bg-(--paper) p-4"
            style={{ borderRadius: "20px 9px 22px 10px / 10px 22px 9px 20px" }}
          >
            <div className="font-hand text-[30px] leading-none">
              {stat.value}
            </div>
            <div className="mt-1 text-[10px] font-bold tracking-[0.14em] text-(--soft) uppercase">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <section className="r-card ink-border flat-3 bg-(--paper) p-5">
          <h2 className="font-hand mb-3 text-[21px]">{admin.recentProjects}</h2>
          {recent.map((project) => {
            const isLive = Boolean(project.liveUrl);
            return (
              <div
                key={project.id}
                className="grid grid-cols-[1fr_90px_74px] items-center gap-2.5 border-b-2 border-dashed border-(--line) py-2.5 last:border-b-0"
              >
                <span className="truncate text-[13px] font-semibold">
                  {project.title}
                </span>
                <span className="font-tech text-[11px] text-(--soft)">
                  {project.date}
                </span>
                <span
                  className={cn(
                    "border-[1.5px] border-(--line) px-2 py-1 text-center text-[9px] font-bold tracking-[0.1em] uppercase",
                    isLive
                      ? "bg-(--accent) text-white"
                      : "bg-transparent text-(--ink)",
                  )}
                  style={{
                    borderRadius: "12px 5px 14px 6px / 6px 14px 5px 12px",
                  }}
                >
                  {isLive ? admin.status.live : admin.status.draft}
                </span>
              </div>
            );
          })}
        </section>

        <section className="r-card-alt ink-border flat-3 bg-(--wash) p-5">
          <h2 className="font-hand mb-3 text-[21px]">{admin.inbox}</h2>
          <div className="flex flex-col gap-3">
            {inbox && inbox.length > 0 ? (
              inbox.map((message) => (
                <article
                  key={message.id}
                  className="r-chip ink-border bg-(--paper) p-3 transition-all duration-[0.22s] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_var(--line)]"
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-[13px] font-bold">
                      {message.name}
                    </span>
                    <span className="font-tech text-[10px] text-(--soft)">
                      {relativeAge(message.createdAt)}
                    </span>
                  </div>
                  <p className="m-0 mt-1.5 line-clamp-2 text-[12px] leading-[1.5] text-(--soft)">
                    {message.message}
                  </p>
                </article>
              ))
            ) : (
              <p className="ink-border-dashed r-chip m-0 px-4 py-6 text-center text-[13px] text-(--soft)">
                {inbox === null ? dict.ui.states.error : dict.ui.states.empty}
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
