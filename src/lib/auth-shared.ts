// Edge-safe helpers used by both middleware and server actions.
// Do NOT add Node-only imports here.

export const SESSION_COOKIE = "ghl-owner-session";

// SHA-256 of (passcode + version tag). Cookie stores this hash, never the
// passcode itself, so log lines and debuggers don't reveal it. Bump the version
// tag to invalidate all existing sessions without changing the passcode.
export async function computeToken(passcode: string): Promise<string> {
  const enc = new TextEncoder().encode(`${passcode}:v1`);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
