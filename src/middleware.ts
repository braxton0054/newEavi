import { NextRequest, NextResponse } from "next/server";

// Public API paths that don't require authentication
// (individual routes may still have their own auth for granular control)
const publicPaths = [
  "/api/auth",
  "/api/apply",
  "/api/courses",
  "/api/files",
  "/api/upload",
  "/api/admin/whatsapp/ping",   // uses x-cron-secret header for cron pingers
  "/api/fee-structures",
];

function isPublic(pathname: string): boolean {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public paths
  if (isPublic(pathname)) return NextResponse.next();

  // Only protect API routes
  if (pathname.startsWith("/api/")) {
    // Fetch session check via internal URL — NOT req.url (which may be HTTPS
    // through a reverse-proxy, causing SSL handshake failures on the internal
    // HTTP server).  Use the internal base from AUTH_API_URL or fall back to
    // localhost:4000.
    const base = process.env.AUTH_API_URL || "http://localhost:4000";
    const sessionRes = await fetch(new URL("/api/auth/me", base), {
      headers: { cookie: req.headers.get("cookie") || "" },
    });

    if (sessionRes.status !== 200) {
      // Allow /api/admin/whatsapp/ping through if it has a valid cron secret
      if (pathname === "/api/admin/whatsapp/ping") {
        const cronSecret = req.headers.get("x-cron-secret");
        const expected = process.env.CRON_SECRET;
        if (cronSecret && expected && cronSecret === expected) {
          return NextResponse.next();
        }
      }

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
