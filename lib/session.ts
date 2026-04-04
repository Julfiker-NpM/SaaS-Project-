import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE_NAME = "flowpm_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30;

function secret(): string {
  return process.env.AUTH_SECRET ?? "flowpm-dev-only-change-in-production";
}

export function createSessionToken(userId: string): string {
  const ts = Date.now().toString();
  const payload = `${userId}.${ts}`;
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`, "utf8").toString("base64url");
}

export function parseSessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot === -1) return null;
    const sig = decoded.slice(lastDot + 1);
    const payload = decoded.slice(0, lastDot);
    const expected = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))) return null;
    const userDot = payload.indexOf(".");
    if (userDot === -1) return null;
    return payload.slice(0, userDot);
  } catch {
    return null;
  }
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return parseSessionToken(raw);
}

export async function setSessionCookie(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SEC,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
