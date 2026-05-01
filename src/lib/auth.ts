import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, computeToken } from "./auth-shared";

export async function isUnlocked(): Promise<boolean> {
  const passcode = process.env.OWNER_PASSCODE;
  if (!passcode) return false;
  const jar = await cookies();
  const cookie = jar.get(SESSION_COOKIE);
  if (!cookie) return false;
  return cookie.value === (await computeToken(passcode));
}

export async function requireOwner(): Promise<void> {
  if (!(await isUnlocked())) {
    throw new Error("Unauthorized: owner passcode required");
  }
}
