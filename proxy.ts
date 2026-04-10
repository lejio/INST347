import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Auth.js session cookie (authjs.session-token or __Secure-authjs.session-token)
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  // Protect dashboard pages — redirect to login
  if (pathname.startsWith("/dashboard") && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect flashcard API routes (except /api/flashcards/public) — return 401
  if (
    pathname.startsWith("/api/flashcards") &&
    !pathname.startsWith("/api/flashcards/public") &&
    !hasSession
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/flashcards/:path*"],
};
