import Link from "next/link";
import { requestPasswordReset } from "./actions";

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { locale } = await params;
  const { error, sent } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-[22px]">
      <div className="r-frame ink-border flat-5 w-full max-w-[380px] bg-(--paper) p-7">
        <p className="font-note m-0 text-[19px] text-(--soft)">lost the key</p>
        <h1 className="font-hand mb-5 text-[clamp(1.625rem,4.5vw,1.875rem)] leading-none">
          Reset password
        </h1>

        {sent ? (
          <>
            <p className="ink-border-dashed r-chip m-0 px-4 py-3 text-[13px] leading-[1.6]">
              If that email has an account, a reset link is on its way. The link
              expires after one hour.
            </p>
            <Link
              href={`/${locale}/login`}
              className="r-tag ink-border lift-chip mt-4 inline-block px-4 py-2.5 text-[12px] font-bold"
            >
              ← Back to login
            </Link>
          </>
        ) : (
          <form action={requestPasswordReset} className="flex flex-col gap-3.5">
            <input type="hidden" name="locale" value={locale} />

            <label className="flex flex-col gap-[7px]">
              <span className="micro">Email</span>
              <input
                name="email"
                type="email"
                required
                placeholder="hello@example.com"
                className="r-chip ink-border w-full bg-(--wash) px-[15px] py-3 text-[14px] outline-none placeholder:text-(--soft)"
              />
            </label>

            {error && (
              <p
                role="alert"
                className="ink-border-dashed r-chip m-0 px-4 py-3 text-[13px] font-semibold text-(--soft)"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="r-btn ink-border flat-3 lift-btn mt-1 cursor-pointer bg-(--accent) px-[26px] py-[13px] text-[14px] font-bold text-white outline-none"
            >
              Send reset link
            </button>

            <Link
              href={`/${locale}/login`}
              className="text-center text-[12px] text-(--soft) underline"
            >
              Back to login
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
