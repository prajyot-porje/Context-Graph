import { requireSessionUser } from "@/lib/auth/server";
import {
  getSetupStatus,
  retryStagedEntries,
  setCaptureEnabled,
  consentCaptureOnce,
} from "@/lib/db";
import { requireMutationUser } from "@/lib/api/session";
import { handleRouteError } from "@/lib/api/errors";
import { z } from "zod";
import { after } from "next/server";
import { triggerBackgroundDrain } from "@/lib/process-staged";
export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const value = new URL(request.url).searchParams.get("attempt");
    const attempt = value ? z.uuid().parse(value) : undefined;
    return Response.json(await getSetupStatus(user.id, attempt), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return handleRouteError(e, "setup status");
  }
}
export async function PATCH(request: Request) {
  try {
    const user = await requireMutationUser(request);
    const body = z
      .object({
        captureEnabled: z.boolean().optional(),
        consentCapture: z.literal(true).optional(),
        retry: z.boolean().optional(),
      })
      .refine(
        (value) =>
          !(value.consentCapture && value.captureEnabled !== undefined),
        "Choose either first consent or a capture setting update.",
      )
      .parse(await request.json());
    if (body.captureEnabled !== undefined)
      await setCaptureEnabled(user.id, body.captureEnabled);
    if (body.consentCapture) await consentCaptureOnce(user.id);
    if (body.captureEnabled === true || body.consentCapture)
      after(triggerBackgroundDrain);
    if (body.retry) {
      await retryStagedEntries(user.id);
      after(triggerBackgroundDrain);
    }
    return Response.json(await getSetupStatus(user.id));
  } catch (e) {
    return handleRouteError(e, "setup update");
  }
}
