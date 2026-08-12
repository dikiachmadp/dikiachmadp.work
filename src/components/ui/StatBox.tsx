import { cn } from "@/lib/utils";

interface StatBoxProps {
  value: string;
  label: string;
  /** Alternate the rotation direction so neighbours never tilt the same way. */
  index?: number;
}

export default function StatBox({ value, label, index = 0 }: StatBoxProps) {
  return (
    <div
      className={cn(
        "ink-border flat-3 lift-card-sm bg-(--paper) px-[22px] py-[26px] text-center",
        index % 2 === 0 ? "r-btn" : "r-btn-alt",
        index % 2 === 1 && "lift-card-sm-cw",
      )}
    >
      <div className="font-hand text-[52px] leading-none">{value}</div>
      <div className="mt-1.5 text-[11px] font-bold tracking-[0.16em] text-(--soft) uppercase">
        {label}
      </div>
    </div>
  );
}
