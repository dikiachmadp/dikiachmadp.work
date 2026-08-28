/**
 * Penutup halaman jualan.
 *
 * Pembaca yang sampai ke ujung sudah melewati bukti, paket, dan seluruh tanya
 * jawab — persis titik saat keputusan diambil, dan dulu persis di sini halaman
 * berhenti tanpa menawarkan apa pun. Panel tinta terbalik dipakai karena ia
 * satu-satunya permukaan bernada berbeda di seluruh situs ini; resepnya diambil
 * apa adanya dari `sections/CTASection.tsx` supaya keduanya tetap satu bahasa.
 *
 * Tombolnya menggulir ke `#buy`, bukan membuka checkout sendiri — alasan yang
 * sama seperti pada `StickyBuyBar`.
 */
export default function ClosingCta({
  title,
  price,
  label,
}: {
  title: string;
  price: string | null;
  label: string;
}) {
  return (
    <div className="r-panel-lg ink-border flat-6 relative mt-[64px] overflow-hidden bg-(--ink) px-10 py-[60px] text-center text-(--paper)">
      <div className="crosshatch-invert pointer-events-none absolute inset-0 opacity-[0.14]" />
      <div className="relative">
        <h2 className="font-hand mb-3 text-[clamp(2rem,4.6vw,3.4rem)] leading-none">
          {title}
        </h2>
        {price && (
          <p className="font-hand mx-auto mb-7 text-[30px] leading-none opacity-[0.82]">
            {price}
          </p>
        )}
        <a
          href="#buy"
          className="r-btn inline-flex cursor-pointer items-center justify-center border-2 border-(--paper) bg-(--accent) px-8 py-3.5 text-[15px] font-bold tracking-[0.03em] text-white shadow-[3px_3px_0_var(--paper)] transition-all duration-[0.22s] ease-out hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_var(--paper)]"
        >
          {label}
        </a>
      </div>
    </div>
  );
}
