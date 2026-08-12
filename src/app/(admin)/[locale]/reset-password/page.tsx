import Link from "next/link";
import { updatePassword } from "./actions";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;

  // Halaman ini hanya berarti dengan sesi recovery yang aktif.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen items-center justify-center px-[22px]">
      <div className="r-frame ink-border flat-5 w-full max-w-[380px] bg-(--paper) p-7">
        <p className="font-note m-0 text-[19px] text-(--soft)">new key</p>
        <h1 className="font-hand mb-5 text-[30px] leading-none">
          Choose a password
        </h1>

        {!user ? (
          <>
            <p className="ink-border-dashed r-chip m-0 px-4 py-3 text-[13px] leading-[1.6]">
              This page needs a valid reset link. Request a new one and open it
              from your email.
            </p>
            <Link
              href={`/${locale}/forgot-password`}
              className="r-tag ink-border lift-chip mt-4 inline-block px-4 py-2.5 text-[12px] font-bold"
            >
              Request a link
            </Link>
          </>
        ) : (
          <form action={updatePassword} className="flex flex-col gap-3.5">
            <input type="hidden" name="locale" value={locale} />

            <label className="flex flex-col gap-[7px]">
              <span className="micro">New password</span>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                className="r-chip ink-border w-full bg-(--wash) px-[15px] py-3 text-[14px] outline-none placeholder:text-(--soft)"
              />
            </label>

            <label className="flex flex-col gap-[7px]">
              <span className="micro">Confirm password</span>
              <input
                name="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                className="r-chip-alt ink-border w-full bg-(--wash) px-[15px] py-3 text-[14px] outline-none placeholder:text-(--soft)"
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
              Save password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
