import { createHmac } from "node:crypto";
import { consumeAuthLimit } from "./db";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export function authIdentity(value: string): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("Authentication is not configured");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function limitAuth(key: string, window: number, max: number) {
  return consumeAuthLimit(authIdentity(key), window, max);
}

export function trustedAuthOrigins(): string[] {
  const urls = [process.env.BETTER_AUTH_URL, process.env.NEXT_PUBLIC_APP_URL];
  if (process.env.VERCEL_URL) urls.push(`https://${process.env.VERCEL_URL}`);
  if (process.env.NODE_ENV !== "production")
    urls.push("http://localhost:3000", "http://127.0.0.1:3000");
  return [
    ...new Set(
      urls.filter((v): v is string => !!v).map((v) => new URL(v).origin),
    ),
  ];
}

export function authRequestIdentity(request: Request): string {
  // Vercel overwrites this header at its ingress. Never trust arbitrary forwarded
  // headers on a directly reachable development server.
  return process.env.VERCEL === "1"
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown"
    : "local";
}
