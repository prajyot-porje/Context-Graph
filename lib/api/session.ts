import { requireSessionUser } from "@/lib/auth/server";
import { DataError } from "@/lib/db";
import { getBaseUrl } from "@/lib/auth";

export async function requireMutationUser(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = new Set([
    new URL(request.url).origin,
    new URL(getBaseUrl()).origin,
  ]);
  if (!origin || !allowed.has(origin))
    throw new DataError("Refresh the page and try again.", 403);
  return requireSessionUser();
}
