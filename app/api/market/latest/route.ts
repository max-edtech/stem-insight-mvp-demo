import { NextResponse } from "next/server";
import { getLatestMarketSignals } from "@/lib/queries/market";

export const dynamic = "force-dynamic";

export async function GET() {
  const signals = await getLatestMarketSignals();
  return NextResponse.json(signals);
}

