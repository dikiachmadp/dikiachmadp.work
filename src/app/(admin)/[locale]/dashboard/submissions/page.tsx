import ConfirmSubmitButton from "@/components/interactive/ConfirmSubmitButton";
import { getSubmissionsPage } from "@/lib/db/contact";
import { requireUser } from "@/lib/supabase/auth";
import { deleteSubmissionAction } from "./actions";

const PER_PAGE = 25;

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireUser(locale);

  const { rows, total } = await getSubmissionsPage({
    page: 1,
    perPage: PER_PAGE,
  });

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-hand text-[34px] leading-none">Messages</h1>
        <span className="text-[12px] text-(--soft)">{total} total</span>
      </div>

      <div className="flex flex-col gap-3.5">
        {rows.length === 0 ? (
          <p className="r-card ink-border flat-3 m-0 bg-(--paper) px-4 py-8 text-center text-[14px] text-(--soft)">
            No messages yet.
          </p>
        ) : (
          rows.map((message) => (
            <article
              key={message.id}
              className="r-card ink-border flat-3 bg-(--paper) p-5"
            >
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[15px] font-bold">
                  {message.name}
                  <a
                    href={`mailto:${message.email}`}
                    className="ml-2 text-[12px] font-normal text-(--soft) underline"
                  >
                    {message.email}
                  </a>
                </span>
                <span className="font-tech text-[11px] text-(--soft)">
                  {message.createdAt.toISOString().slice(0, 10)}
                </span>
              </div>
              <div className="micro mb-1.5">{message.subject}</div>
              <p className="m-0 text-[14px] leading-[1.7] whitespace-pre-line text-(--soft)">
                {message.message}
              </p>
              <form
                action={deleteSubmissionAction.bind(null, message.id)}
                className="mt-3"
              >
                <input type="hidden" name="formLocale" value={locale} />
                <ConfirmSubmitButton
                  message={`Delete the message from "${message.name}"? This cannot be undone.`}
                  className="r-tag ink-border lift-chip px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] text-(--soft) uppercase"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </article>
          ))
        )}
      </div>
    </>
  );
}
