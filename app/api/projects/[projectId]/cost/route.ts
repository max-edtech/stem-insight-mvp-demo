import { NextResponse } from "next/server";
import { getCostAnalysis } from "@/lib/queries/cost-analysis";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const data = await getCostAnalysis(projectId);
  return NextResponse.json(data);
}
