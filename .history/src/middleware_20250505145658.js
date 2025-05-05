// src/middleware.js
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function middleware(req) {
  // Create a response object
  const res = NextResponse.next();

  // Don't create middleware client on the login page to avoid session checks causing loops
  const pathname = req.nextUrl.pathname;

  // Skip session check for the login page
  if (pathname === "/login") {
    return res;
  }

  // Only check auth for protected routes, not for login
  const protectedRoutes = ["/dashboard", "/scenario", "/calculator"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const supabase = createMiddlewareClient({ req, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Only redirect if trying to access protected route without session
    if (!session) {
      // Use 302 redirect specifically and add a cache buster
      const redirectUrl = new URL(`/login?cb=${Date.now()}`, req.url);
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/scenario/:path*",
    "/calculator/:path*",
    "/login",
  ],
};
