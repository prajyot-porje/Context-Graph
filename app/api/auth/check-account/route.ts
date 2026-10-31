export async function POST() {
  return Response.json(
    { error: "Use sign in or password recovery." },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
