import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-[22px]">
      <div className="r-frame ink-border flat-5 w-full max-w-[380px] bg-(--paper) p-7">
        <p className="font-note m-0 text-[19px] text-(--soft)">control room</p>
        <h1 className="font-hand mb-5 text-[30px] leading-none">Admin Login</h1>

        <form action={login} className="flex flex-col gap-3.5">
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

          <label className="flex flex-col gap-[7px]">
            <span className="micro">Password</span>
            <input
              name="password"
              type="password"
              required
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
            Login
          </button>

          <Link
            href={`/${locale}/forgot-password`}
            className="text-center text-[12px] text-(--soft) underline"
          >
            Forgot password?
          </Link>
        </form>
      </div>
    </div>
  );
}
