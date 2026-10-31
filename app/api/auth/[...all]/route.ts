import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { authIdentity, limitAuth } from "@/lib/auth-policy";
import { DataError, withAuthIdentityLock } from "@/lib/db";
import { AuthBodyTooLarge, readAuthBody } from "@/lib/api/auth-body";
import { getBaseUrl } from "@/lib/auth-url";

const handlers = toNextJsHandler(auth);
export const GET = handlers.GET;
export async function POST(request: Request) {
  const path = decodeURIComponent(new URL(request.url).pathname).replace(
    /\/+$/,
    "",
  );
  if (["/api/auth/change-password", "/api/auth/set-password"].includes(path)) {
    if (request.headers.get("origin") !== new URL(getBaseUrl()).origin)
      return Response.json(
        { message: "Refresh this page and try again." },
        { status: 403 },
      );
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session)
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    try {
      return await withAuthIdentityLock(
        authIdentity(`credential:${session.user.email.toLowerCase()}`),
        () => handlers.POST(request),
      );
    } catch (error) {
      return Response.json(
        { message: "Please try again." },
        { status: error instanceof DataError ? error.status : 503 },
      );
    }
  }
  if (path === "/api/auth/sign-in/email") {
    if (request.headers.get("origin") !== new URL(getBaseUrl()).origin)
      return Response.json(
        { message: "Refresh this page and try again." },
        { status: 403 },
      );
    try {
      const body = await readAuthBody(request.clone());
      if (
        typeof body === "object" &&
        body &&
        "email" in body &&
        typeof body.email === "string" &&
        body.email.length <= 254
      ) {
        const budget = await limitAuth(
          `login:${body.email.trim().toLowerCase()}`,
          600,
          15,
        );
        if (!budget.allowed)
          return Response.json(
            { message: "Too many sign-in attempts. Try again later." },
            {
              status: 429,
              headers: {
                "Retry-After": String(budget.retryAfter),
                "Cache-Control": "no-store",
              },
            },
          );
        return await withAuthIdentityLock(
          authIdentity(`credential:${body.email.trim().toLowerCase()}`),
          () => handlers.POST(request),
        );
      }
    } catch (error) {
      return Response.json(
        {
          message:
            error instanceof DataError ? error.message : "Unable to sign in.",
        },
        {
          status:
            error instanceof DataError
              ? error.status
              : error instanceof AuthBodyTooLarge
                ? 413
                : 400,
        },
      );
    }
  }
  return handlers.POST(request);
}
