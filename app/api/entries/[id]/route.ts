import { requireMutationUser } from "@/lib/api/session";
import { forgetEntry, resolveEntry } from "@/lib/db";
import { handleRouteError } from "@/lib/api/errors";
import { z } from "zod";
type Params = { params: Promise<{ id: string }> };
export async function DELETE(request: Request, { params }: Params) {
  try {
    const u = await requireMutationUser(request);
    await forgetEntry(z.uuid().parse((await params).id), u.id);
    return Response.json({ success: true });
  } catch (e) {
    return handleRouteError(e, "delete note");
  }
}
export async function PATCH(request: Request, { params }: Params) {
  try {
    const u = await requireMutationUser(request);
    await resolveEntry(z.uuid().parse((await params).id), u.id);
    return Response.json({ success: true });
  } catch (e) {
    return handleRouteError(e, "resolve note");
  }
}
