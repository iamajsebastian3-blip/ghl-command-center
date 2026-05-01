import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, computeToken } from "@/lib/auth-shared";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function POST(req: NextRequest) {
  const passcode = process.env.OWNER_PASSCODE;
  if (!passcode) {
    return NextResponse.json({ ok: false, error: "OWNER_PASSCODE not set" }, { status: 500 });
  }

  let body: { passcode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  if (typeof body.passcode !== "string" || body.passcode.length === 0) {
    return NextResponse.json({ ok: false, error: "Passcode required" }, { status: 400 });
  }

  // Constant-ish delay to dampen brute force on a tiny passcode space.
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (body.passcode !== passcode) {
    return NextResponse.json({ ok: false, error: "Wrong passcode" }, { status: 401 });
  }

  const token = await computeToken(passcode);
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: SESSION_COOKIE, value: "", path: "/", maxAge: 0 });
  return res;
}
