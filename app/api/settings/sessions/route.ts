import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireSessionUser } from "@/lib/auth/server";
import { requireMutationUser } from "@/lib/api/session";
import { getOwnedSessionToken } from "@/lib/db";
import { handleRouteError } from "@/lib/api/errors";
import { z } from "zod";
export async function GET() {
  try {
    await requireSessionUser();
    const requestHeaders = await headers();
    const [current, sessions] = await Promise.all([
      auth.api.getSession({ headers: requestHeaders }),
      auth.api.listSessions({ headers: requestHeaders }),
    ]);
    return Response.json(
      sessions.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        userAgent: s.userAgent,
        current: s.id === current?.session.id,
      })),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleRouteError(error, "sessions");
  }
}
export async function DELETE(request: Request) {
  try {
    const user = await requireMutationUser(request);
    const body = z
      .union([
        z.object({ others: z.literal(true) }).strict(),
        z.object({ id: z.string().min(1).max(200) }).strict(),
      ])
      .parse(await request.json());
    const requestHeaders = await headers();
    if ("others" in body)
      await auth.api.revokeOtherSessions({ headers: requestHeaders });
    else
      await auth.api.revokeSession({
        headers: requestHeaders,
        body: { token: await getOwnedSessionToken(user.id, body.id) },
      });
    return Response.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "session revoke");
  }
}
