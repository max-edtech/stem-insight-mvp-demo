export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    service: "construction-budget-demo",
    timestamp: new Date().toISOString(),
  });
}
