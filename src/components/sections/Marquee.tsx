interface MarqueeProps {
  items: string[];
}

/**
 * Full-bleed wash strip between two ink rules. The list is rendered twice so
 * the −50% translation loops seamlessly.
 */
export default function Marquee({ items }: MarqueeProps) {
  const doubled = [...items, ...items];

  return (
    <section
      aria-hidden
      className="mt-[74px] overflow-hidden border-y-2 border-(--line) bg-(--wash) py-[15px]"
    >
      <div className="anim-marq flex w-max">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="font-hand flex items-center gap-[22px] px-[22px] text-[23px] whitespace-nowrap"
          >
            {item}
            <span className="text-(--accent-ink)">✳</span>
          </span>
        ))}
      </div>
    </section>
  );
}
