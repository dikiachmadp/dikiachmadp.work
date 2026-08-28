import { redirect } from "next/navigation";
import Pagination from "@/components/ui/Pagination";
import ConfirmSubmitButton from "@/components/interactive/ConfirmSubmitButton";
import { getOrdersPage } from "@/lib/db/orders";
import { pageCount, parsePageParam } from "@/lib/pagination";
import { requireUser } from "@/lib/supabase/auth";
import { formatCents } from "@/lib/utils";
import { resendReceiptAction } from "./actions";

const PER_PAGE = 25;

/**
 * Daftar transaksi. Bukan salinan dasbor Polar — Polar tetap yang berwenang
 * soal uangnya. Yang ada di sini adalah hal yang tidak dimiliki Polar: nomor
 * tanda terima yang diterbitkan situs ini, dan tombol untuk mengirim ulang
 * dokumennya.
 *
 * Kolom "tanda terima" yang kosong berarti emailnya belum pernah berhasil
 * terkirim — `receiptSentAt` sengaja baru ditandai setelah Resend menerima.
 */
export default async function OrdersPage({
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
  const { rows, total } = await getOrdersPage({
    page: current,
    perPage: PER_PAGE,
  });

  // Halaman di luar jangkauan mendarat di daftar kosong yang berbunyi "belum
  // ada pesanan" — padahal pesanannya ada.
  const pages = pageCount(total, PER_PAGE);
  if (current > pages) {
    redirect(`/${locale}/dashboard/orders${pages > 1 ? `?page=${pages}` : ""}`);
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-hand text-[clamp(1.75rem,5vw,2.125rem)] leading-none">
          Orders
        </h1>
        <span className="text-[12px] text-(--soft)">{total} total</span>
      </div>

      <div className="flex flex-col gap-3.5">
        {rows.length === 0 ? (
          <p className="r-card ink-border flat-3 m-0 bg-(--paper) px-4 py-8 text-center text-[14px] text-(--soft)">
            No orders yet.
          </p>
        ) : (
          rows.map((order) => (
            <article
              key={order.id}
              className="r-card ink-border flat-3 bg-(--paper) p-5"
            >
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-tech text-[13px] font-bold tracking-[0.08em]">
                  {order.orderNumber}
                </span>
                <span className="font-tech text-[11px] text-(--soft)">
                  {order.createdAt.toISOString().slice(0, 10)}
                </span>
              </div>

              <div className="text-[15px] font-bold">
                {order.productTitle || "—"}
                <span className="ml-2 text-[13px] font-normal text-(--soft)">
                  {order.amount > 0
                    ? formatCents(
                        order.amount,
                        order.currency,
                        order.locale === "id" ? "id" : "en",
                      )
                    : "Free"}
                </span>
              </div>

              <div className="mt-1 text-[12px] text-(--soft)">
                {order.email || "(no email on the order)"} · {order.locale}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a
                  href={`/${order.locale === "id" ? "id" : "en"}/orders/${order.receiptToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="r-tag ink-border bg-(--paper) px-3 py-[7px] text-[11px] font-bold"
                >
                  Receipt ↗
                </a>

                <form action={resendReceiptAction.bind(null, order.id)}>
                  <input type="hidden" name="formLocale" value={locale} />
                  <input type="hidden" name="page" value={current} />
                  <ConfirmSubmitButton
                    message={`Send the receipt to ${order.email || "this buyer"} again?`}
                    className="r-tag ink-border bg-transparent px-3 py-[7px] text-[11px] font-bold text-(--soft)"
                  >
                    Resend
                  </ConfirmSubmitButton>
                </form>

                <span className="font-tech text-[10px] tracking-[0.12em] text-(--soft) uppercase">
                  {order.receiptSentAt
                    ? `sent ${order.receiptSentAt.toISOString().slice(0, 10)}`
                    : "not sent"}
                </span>
              </div>
            </article>
          ))
        )}
      </div>

      <Pagination
        current={current}
        total={total}
        perPage={PER_PAGE}
        basePath={`/${locale}/dashboard/orders`}
        label="Orders pages"
      />
    </>
  );
}
