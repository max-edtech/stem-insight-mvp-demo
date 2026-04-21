import { NextResponse } from "next/server";
import { getAcceptanceReadiness } from "@/lib/queries/acceptance";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const readiness = await getAcceptanceReadiness(projectId);

  if (!readiness) {
    return NextResponse.json({ message: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(readiness);
}
