// src/proxy.ts
// Mengatur routing otomatis untuk sistem multi-bahasa (i18n) menggunakan konvensi proxy Next.js terbaru

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'id'];
const defaultLocale = 'en';

// PERUBAHAN: Mengubah 'export function middleware' menjadi 'export default function proxy'
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati pengecekan untuk file statis, gambar, dan API
  if (
    pathname.includes('.') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // Cek apakah URL sudah memiliki locale (misal: /en/about atau /id/about)
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Redirect ke locale default jika tidak ada locale di URL
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Jalankan proxy pada semua path kecuali file statis dan internal Next.js
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};