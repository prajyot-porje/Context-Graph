import { cancelImport, commitImport, getImport, reviewImport } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/server";
import { requireMutationUser } from "@/lib/api/session";
import { handleRouteError } from "@/lib/api/errors";
import { z } from "zod";
type Params = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireSessionUser();
    return Response.json(
      await getImport(user.id, z.uuid().parse((await params).id)),
    );
  } catch (e) {
    return handleRouteError(e, "get import");
  }
}
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireMutationUser(request),
      id = z.uuid().parse((await params).id);
    const body = z
      .discriminatedUnion("action", [
        z.object({
          action: z.literal("review"),
          items: z.unknown(),
          revision: z.number().int().nonnegative(),
        }),
        z.object({
          action: z.literal("commit"),
          revision: z.number().int().nonnegative(),
        }),
        z.object({ action: z.literal("cancel") }),
      ])
      .parse(await request.json());
    if (body.action === "review")
      return Response.json(
        await reviewImport(user.id, id, body.items, body.revision),
      );
    if (body.action === "commit")
      return Response.json(await commitImport(user.id, id, body.revision));
    await cancelImport(user.id, id);
    return Response.json({ success: true });
  } catch (e) {
    return handleRouteError(e, "update import");
  }
}
