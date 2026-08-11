import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const locales = ["en", "id"];
const defaultLocale = "en";

// The (admin) route group does not appear in URLs, so protected admin
// paths look like /en/dashboard/... — match on the /dashboard segment.
const protectedPattern = new RegExp(`^/(${locales.join("|")})/dashboard(/|$)`);
const loginPattern = new RegExp(`^/(${locales.join("|")})/login(/|$)`);

/** Locale routing runs regardless of auth; only the guard needs Supabase. */
function withLocale(request: NextRequest, response: NextResponse) {
  const { pathname } = request.nextUrl;

  if (
    pathname.includes(".") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next")
  ) {
    return response;
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) {
    return response;
  }

  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase credentials the auth guard cannot run. Fail closed on
  // /dashboard rather than crashing every request in the app.
  if (!supabaseUrl || !supabaseKey) {
    if (protectedPattern.test(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${pathname.split("/")[1]}/login`;
      return NextResponse.redirect(url);
    }
    return withLocale(request, response);
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates the token with Supabase Auth, unlike getSession().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (protectedPattern.test(pathname) && !user) {
    const url = request.nextUrl.clone();
    const locale = pathname.split("/")[1];
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  if (loginPattern.test(pathname) && user) {
    const url = request.nextUrl.clone();
    const locale = pathname.split("/")[1];
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  // Locale routing: leave assets/API alone, prefix everything else.
  return withLocale(request, response);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
