/**
 * Plain `<form method="get">` instead of a client-side filter like
 * ProjectsExplorer: the logbook index is server-paginated and `body` is
 * deliberately stripped from index cards, so filtering client-side would mean
 * either pulling every post's summary to the browser regardless of page size,
 * or duplicating the query logic in two places. A GET form works without JS,
 * keeps the result shareable as a URL, and lets `getPublishedPosts` do the
 * filtering where the data already lives.
 */
export default function LogbookSearch({
  basePath,
  query,
  placeholder,
  label,
}: {
  basePath: string;
  query: string;
  placeholder: string;
  label: string;
}) {
  return (
    <form
      action={basePath}
      method="get"
      className="mb-[30px] border-b-2 border-dashed border-(--line) pb-[22px]"
    >
      <label
        className="ink-border flex w-full items-center gap-[9px] bg-(--paper) px-[15px] py-2 sm:w-auto sm:min-w-[280px]"
        style={{ borderRadius: "20px 9px 22px 8px / 8px 22px 9px 20px" }}
      >
        <span className="sr-only">{label}</span>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden
          className="shrink-0"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={placeholder}
          className="w-full flex-1 border-none bg-transparent text-[12px] font-semibold tracking-[0.05em] outline-none placeholder:text-(--soft)"
        />
      </label>
    </form>
  );
}
