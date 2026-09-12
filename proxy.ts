import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Edge Proxy & Route Guard — runs BEFORE every request.
 *
 * Responsibilities:
 * Request tracing & security headers (x-request-id)
 *
 * Note: User authentication is managed seamlessly via Web3 wallet sessions
 * and verified per API route without disruptive route bounces.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Request Tracing & Security Headers ───────────
  const response = NextResponse.next();

  response.headers.set("x-request-id", crypto.randomUUID());

  return response;
}

// Backward-compatibility export for Next.js middleware runner
export const middleware = proxy;

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
