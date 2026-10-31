import { requireSessionUser } from "@/lib/auth/server";
import { exportUserContext } from "@/lib/db";
import { handleRouteError } from "@/lib/api/errors";
export async function GET() {
  try {
    const user = await requireSessionUser();
    const data = await exportUserContext(user.id);
    return Response.json(data, {
      headers: {
        "Content-Disposition":
          'attachment; filename="contextgraph-export.json"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleRouteError(error, "context export");
  }
}
