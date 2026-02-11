import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the pathname is just the root or just the locale
  // e.g., "/" or "/ar" or "/en"
  const isRootPath = pathname === "/";
  const isLocaleOnlyPath = pathname === "/ar" || pathname === "/en";

  if (isRootPath || isLocaleOnlyPath) {
    // Extract locale from pathname or use default
    const locale = isLocaleOnlyPath ? pathname.slice(1) : routing.defaultLocale;

    // Redirect to dashboard with the appropriate locale
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  // For all other paths, use the intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
