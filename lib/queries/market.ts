import { prisma } from "@/lib/prisma";

const SERIES_ORDER = [
  "cci.rebar.index",
  "cci.labor.index",
  "cci.steel_worker.index",
] as const;

export interface MarketSignal {
  seriesKey: string;
  seriesLabel: string;
  period: string;
  value: number;
  momChangePct: number | null;
  yoyChangePct: number | null;
  sourceUrl: string | null;
  fetchedAt: string;
}

export interface ProjectMarketImpact {
  seriesKey: string;
  period: string;
  changePct: number;
  thresholdPct: number;
  projectedProfit: number;
  projectedProfitRate: number;
  totalDelta: number;
  triggeredAt: string;
}

export async function getLatestMarketSignals(): Promise<MarketSignal[]> {
  const rows = await prisma.marketSnapshot.findMany({
    where: {
      seriesKey: {
        in: [...SERIES_ORDER],
      },
    },
    orderBy: [{ seriesKey: "asc" }, { gregorianYear: "desc" }, { month: "desc" }],
  });

  const latestBySeries = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latestBySeries.has(row.seriesKey)) {
      latestBySeries.set(row.seriesKey, row);
    }
  }

  return [...latestBySeries.values()].map((row) => ({
    seriesKey: row.seriesKey,
    seriesLabel: row.seriesLabel,
    period: row.period,
    value: row.value,
    momChangePct: row.momChangePct,
    yoyChangePct: row.yoyChangePct,
    sourceUrl: row.sourceUrl,
    fetchedAt: row.fetchedAt.toISOString(),
  }));
}

export async function getProjectLatestMarketImpacts(
  projectId: string
): Promise<ProjectMarketImpact[]> {
  const rows = await prisma.projectProfitImpact.findMany({
    where: { projectId },
    include: { alert: true },
    orderBy: [{ triggeredAt: "desc" }],
  });

  const latestBySeries = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latestBySeries.has(row.seriesKey)) {
      latestBySeries.set(row.seriesKey, row);
    }
  }

  return [...latestBySeries.values()].map((row) => ({
    seriesKey: row.seriesKey,
    period: row.period,
    changePct: row.alert.changePct,
    thresholdPct: row.alert.thresholdPct,
    projectedProfit: row.projectedProfit,
    projectedProfitRate: row.projectedProfitRate,
    totalDelta: row.totalDelta,
    triggeredAt: row.triggeredAt.toISOString(),
  }));
}

