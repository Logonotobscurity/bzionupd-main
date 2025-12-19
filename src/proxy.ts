import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

/**
 * Enhanced proxy for route protection
 * Single source of truth for redirect logic
 * Prevents infinite redirect loops by centralizing all redirect decisions
 */
export default withAuth(
  function proxy(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAdmin = token?.role === "admin";

    // ADMIN ROUTES: Only admins allowed
    if (pathname.startsWith("/admin")) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
      return NextResponse.next();
    }

    // PROTECTED ROUTES: Must be authenticated
    if (pathname.startsWith("/account")) {
      if (!isAuth) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      return NextResponse.next();
    }

    // AUTH PAGES: Redirect authenticated users away
    // This prevents authenticated users from seeing login/register pages
    if (pathname === "/login" || pathname === "/register") {
      if (isAuth) {
        // Authenticated users go to their dashboard based on role
        const redirectUrl = isAdmin ? "/admin" : "/account";
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }
      // Not authenticated - allow access to login/register
      return NextResponse.next();
    }

    // Allow all other routes
    return NextResponse.next();
  },
  {
    callbacks: {
      // This callback determines if the request is authorized
      // Return true to allow, false to block (middleware will redirect)
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes - always allow
        if (
          pathname === "/login" ||
          pathname === "/register" ||
          pathname === "/" ||
          pathname.startsWith("/api/auth")
        ) {
          return true;
        }

        // Protected routes - require authentication
        if (pathname.startsWith("/account") || pathname.startsWith("/admin")) {
          return !!token;
        }

        // Default - allow
        return true;
      },
    },
  }
);

// Include all routes that need protection or special handling
export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/login",
    "/register",
  ],
};
