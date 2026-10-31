import { handleAuthFlow } from "@/lib/auth-flow";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  return handleAuthFlow(request, (await params).action);
}
