import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    // Check if the user is authenticated from the token
    const isAuth = !!req.nextauth.token;

    const isAuthPage =
      pathname === "/login" ||
      pathname === "/register" ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password");

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        const isProtectedRoute =
          pathname.startsWith("/superadmin") ||
          pathname.startsWith("/admin") ||
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/profile") ||
          pathname.startsWith("/settings") ||
          pathname.startsWith("/cf-verify");
        
        if (isProtectedRoute && !token) {
          return false;
        }

        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
