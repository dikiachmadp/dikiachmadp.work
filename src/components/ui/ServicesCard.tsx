import { ServicesData } from "@/types/content";

type Service = ServicesData["items"][number];

interface ServicesCardProps {
  service: Service;
}

/** The full service card used on /services: number, title, summary, deliverables. */
export default function ServicesCard({ service }: ServicesCardProps) {
  return (
    <div
      className="ink-border flat-3 lift-card-sm bg-(--paper) p-[26px]"
      style={{ borderRadius: "28px 12px 30px 13px / 13px 30px 12px 28px" }}
    >
      <div className="flex items-baseline gap-3">
        <span className="font-hand text-[34px] leading-none text-(--accent-ink)">
          {String(service.order).padStart(2, "0")}
        </span>
        <h2 className="font-hand text-[25px]">{service.title}</h2>
      </div>

      <p className="m-justify mt-2.5 mb-4 text-[15px] leading-[1.65] text-(--soft)">
        {service.summary}
      </p>

      <div className="dashed-rule mb-3.5" />

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {service.deliverables.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-[14px]">
            <span
              className="ink-border flex h-4 w-4 shrink-0 items-center justify-center"
              style={{
                borderRadius: "54% 46% 48% 52% / 50% 52% 48% 50%",
              }}
            >
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M4 13l6 6L20 5" />
              </svg>
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
