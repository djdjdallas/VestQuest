import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check for auth_success flag in the cookie to prevent redirect loops
  const url = new URL(req.url);
  const authSuccess = req.cookies.get("auth_success")?.value === "true";

  // If user is not signed in and trying to access protected routes
  if (!user && !authSuccess && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If user is not signed in and trying to access protected routes
  if (!user && !authSuccess && req.nextUrl.pathname.startsWith("/scenario")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If user is not signed in and trying to access protected routes
  if (!user && !authSuccess && req.nextUrl.pathname.startsWith("/calculator")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If user is already signed in and trying to access login/signup page
  if (user && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
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
