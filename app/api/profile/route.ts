import { requireSessionUser } from "@/lib/auth/server";
import { requireMutationUser } from "@/lib/api/session";
import { getUserProfile, updateUserProfile, DataError } from "@/lib/db";
import { handleRouteError } from "@/lib/api/errors";
import { readAuthBody, AuthBodyTooLarge } from "@/lib/api/auth-body";
import { profileSchema } from "@/lib/profile";
export async function GET() {
  try {
    const user = await requireSessionUser();
    return Response.json(await getUserProfile(user.id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return handleRouteError(error, "profile");
  }
}
export async function PATCH(request: Request) {
  try {
    const user = await requireMutationUser(request);
    const input = profileSchema.parse(await readAuthBody(request, 26000));
    const old = await getUserProfile(user.id);
    return Response.json(
      await updateUserProfile(
        user.id,
        input.name,
        input.image === undefined ? old.image : input.image,
      ),
    );
  } catch (error) {
    if (error instanceof AuthBodyTooLarge)
      return handleRouteError(
        new DataError("Profile image is too large.", 413),
        "profile update",
      );
    if (error instanceof SyntaxError)
      return handleRouteError(
        new DataError("Invalid profile request.", 400),
        "profile update",
      );
    return handleRouteError(error, "profile update");
  }
}
