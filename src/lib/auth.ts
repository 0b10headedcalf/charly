import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export type Session = {
  id: string;
  name: string;
  avatarUrl?: string;
  provider: "github" | "guest";
};

const COOKIE = "charly-session";
// Hackathon-grade: falls back to a fixed dev secret so guest mode works with
// zero config. Set AUTH_SECRET in production.
const SECRET = process.env.AUTH_SECRET || "charly-dev-secret";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function encodeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return decodeSession(store.get(COOKIE)?.value);
}

export function sessionCookie(session: Session) {
  return {
    name: COOKIE,
    value: encodeSession(session),
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export const SESSION_COOKIE_NAME = COOKIE;

export function githubConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}
