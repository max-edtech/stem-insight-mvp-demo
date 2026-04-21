import { NextResponse } from "next/server";
import { syncMarketSnapshots } from "@/lib/market/sync";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    message: "Use POST to trigger market synchronization.",
  });
}

export async function POST() {
  try {
    const result = await syncMarketSnapshots();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Market sync failed",
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 }
    );
  }
}
