import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, computeToken } from "@/lib/auth-shared";

// Routes that don't require the owner cookie:
//   /unlock              — passcode form
//   /api/unlock          — POST endpoint that sets the cookie
//   /api/supabase-health — dev smoke test
//   /c/<slug>            — public read-only client view
//   /clients/...         — public images served from /public/clients
const PUBLIC_PATHS = [/^\/unlock$/, /^\/api\/unlock(\/|$)/, /^\/api\/supabase-health(\/|$)/, /^\/c\//, /^\/clients\//];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  const passcode = process.env.OWNER_PASSCODE;
  if (!passcode) {
    return new NextResponse(
      "OWNER_PASSCODE is not set in .env.local. Set it and restart the dev server.",
      { status: 500 }
    );
  }

  const cookie = req.cookies.get(SESSION_COOKIE);
  const expected = await computeToken(passcode);

  if (!cookie || cookie.value !== expected) {
    const url = req.nextUrl.clone();
    url.pathname = "/unlock";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every path EXCEPT static assets and Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|css|js)).*)"],
};
