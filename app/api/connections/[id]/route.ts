import { revokeConnection } from "@/lib/db";
import { requireMutationUser } from "@/lib/api/session";
import { handleRouteError } from "@/lib/api/errors";
import { z } from "zod";
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireMutationUser(request);
    await revokeConnection(user.id, z.uuid().parse((await params).id));
    return Response.json({ success: true });
  } catch (e) {
    return handleRouteError(e, "disconnect");
  }
}
