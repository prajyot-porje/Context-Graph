import { requireMutationUser } from "@/lib/api/session";
import { discardUserDrafts } from "@/lib/db";
import { handleRouteError } from "@/lib/api/errors";
export async function DELETE(request: Request) {
  try {
    const user = await requireMutationUser(request);
    return Response.json({ discarded: await discardUserDrafts(user.id) });
  } catch (error) {
    return handleRouteError(error, "discard drafts");
  }
}
