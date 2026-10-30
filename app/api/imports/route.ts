import { createImport, submitImport } from "@/lib/db";
import { providerSchema } from "@/lib/setup";
import { requireMutationUser } from "@/lib/api/session";
import { handleRouteError } from "@/lib/api/errors";
import { z } from "zod";
export async function POST(request: Request) {
  try {
    const user = await requireMutationUser(request);
    const body = z
      .object({ provider: providerSchema, notes: z.unknown().optional() })
      .parse(await request.json());
    const run = await createImport(user.id, body.provider);
    return Response.json(
      body.notes ? await submitImport(user.id, run.id, body.notes) : run,
      { status: 201 },
    );
  } catch (e) {
    return handleRouteError(e, "create import");
  }
}
