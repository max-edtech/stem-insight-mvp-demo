import { prisma } from "@/lib/prisma";
import { CCI_SOURCE_URL, fetchCciSeries } from "@/lib/market/cci";

export interface MarketSyncResult {
  fetchedAt: string;
  snapshotsUpserted: number;
  alertsTriggered: number;
  impactsUpserted: number;
  series: Array<{
    seriesKey: string;
    period: string | null;
    value: number | null;
    momChangePct: number | null;
    triggered: boolean;
  }>;
}

interface SeriesConfig {
  seriesKey: string;
  seriesLabel: string;
  categoriesId?: string;
  categoryIds?: string;
  exposureRate: number;
}

const THRESHOLD_PCT = 0.25;

const SERIES_CONFIGS: SeriesConfig[] = [
  {
    seriesKey: "cci.rebar.index",
    seriesLabel: "CCI 鋼筋指數(16)",
    categoriesId: "16",
    exposureRate: 0.18,
  },
  {
    seriesKey: "cci.labor.index",
    seriesLabel: "CCI 工資類指數(3)",
    categoryIds: "3",
    exposureRate: 0.25,
  },
  {
    seriesKey: "cci.steel_worker.index",
    seriesLabel: "CCI 鋼筋工指數(88)",
    categoriesId: "88",
    exposureRate: 0.1,
  },
];

function getNowRange() {
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;
  return {
    startYear: endYear - 2,
    startMonth: 1,
    endYear,
    endMonth,
  };
}

function getIndirectRateFromSnapshot(snapshotText: string | null) {
  if (!snapshotText) return 0.12;
  try {
    const parsed = JSON.parse(snapshotText) as {
      records?: Array<{ key?: string; value?: number }>;
    };
    const records = parsed.records ?? [];
    const byKey = new Map(records.map((record) => [record.key ?? "", Number(record.value ?? 0)]));
    const soft = Number(byKey.get("cost.softCostRate") ?? 0);
    const marketing = Number(byKey.get("cost.marketingRate") ?? 0);
    const admin = Number(byKey.get("cost.adminRate") ?? 0);
    const computed = (soft + marketing + admin) / 100;
    if (Number.isFinite(computed) && computed > 0) return computed;
  } catch {
    return 0.12;
  }
  return 0.12;
}

function estimateImpact({
  totalBudget,
  contractAmount,
  changePct,
  exposureRate,
  indirectRate,
}: {
  totalBudget: number;
  contractAmount: number;
  changePct: number;
  exposureRate: number;
  indirectRate: number;
}) {
  const costDelta = totalBudget * exposureRate * (changePct / 100);
  const indirectDelta = costDelta * indirectRate;
  const totalDelta = costDelta + indirectDelta;
  const projectedProfit = contractAmount - (totalBudget + totalDelta);
  const projectedProfitRate =
    contractAmount > 0 ? (projectedProfit / contractAmount) * 100 : 0;

  return {
    costDelta,
    indirectDelta,
    totalDelta,
    projectedProfit,
    projectedProfitRate,
  };
}

export async function syncMarketSnapshots(): Promise<MarketSyncResult> {
  const range = getNowRange();
  const fetchedAt = new Date().toISOString();

  let snapshotsUpserted = 0;
  let alertsTriggered = 0;
  let impactsUpserted = 0;
  const seriesResults: MarketSyncResult["series"] = [];

  const projects = await prisma.project.findMany({
    select: {
      id: true,
      totalBudget: true,
      contractAmount: true,
      parameterSnapshot: true,
    },
  });

  for (const config of SERIES_CONFIGS) {
    const points = await fetchCciSeries({
      categoriesId: config.categoriesId,
      categoryIds: config.categoryIds,
      ...range,
    });

    for (const point of points) {
      await prisma.marketSnapshot.upsert({
        where: {
          seriesKey_period: {
            seriesKey: config.seriesKey,
            period: point.period,
          },
        },
        update: {
          seriesLabel: config.seriesLabel,
          gregorianYear: point.gregorianYear,
          month: point.month,
          value: point.value,
          momChangePct: point.momChangePct,
          yoyChangePct: point.yoyChangePct,
          sourceUrl: CCI_SOURCE_URL,
          fetchedAt: new Date(),
        },
        create: {
          seriesKey: config.seriesKey,
          seriesLabel: config.seriesLabel,
          period: point.period,
          gregorianYear: point.gregorianYear,
          month: point.month,
          value: point.value,
          momChangePct: point.momChangePct,
          yoyChangePct: point.yoyChangePct,
          sourceUrl: CCI_SOURCE_URL,
          sourceType: "official_index",
          fetchedAt: new Date(),
        },
      });
      snapshotsUpserted += 1;
    }

    const latestPoint = points[points.length - 1] ?? null;
    const latestSnapshot =
      latestPoint === null
        ? null
        : await prisma.marketSnapshot.findUnique({
            where: {
              seriesKey_period: {
                seriesKey: config.seriesKey,
                period: latestPoint.period,
              },
            },
          });

    const latestMom = latestPoint?.momChangePct ?? null;
    const shouldTrigger =
      latestPoint !== null &&
      latestMom !== null &&
      Math.abs(latestMom) >= THRESHOLD_PCT &&
      latestSnapshot !== null;

    if (shouldTrigger && latestSnapshot) {
      const alert = await prisma.marketAlert.upsert({
        where: {
          seriesKey_period_thresholdPct: {
            seriesKey: config.seriesKey,
            period: latestPoint.period,
            thresholdPct: THRESHOLD_PCT,
          },
        },
        update: {
          changePct: latestMom,
          direction: latestMom >= 0 ? "up" : "down",
          status: "active",
          snapshotId: latestSnapshot.id,
          sourceUrl: CCI_SOURCE_URL,
        },
        create: {
          seriesKey: config.seriesKey,
          period: latestPoint.period,
          thresholdPct: THRESHOLD_PCT,
          changePct: latestMom,
          direction: latestMom >= 0 ? "up" : "down",
          status: "active",
          snapshotId: latestSnapshot.id,
          sourceUrl: CCI_SOURCE_URL,
        },
      });

      alertsTriggered += 1;

      for (const project of projects) {
        const totalBudget = Number(project.totalBudget ?? 0);
        const contractAmount = Number(project.contractAmount ?? 0);
        if (totalBudget <= 0 || contractAmount <= 0) continue;

        const indirectRate = getIndirectRateFromSnapshot(project.parameterSnapshot);
        const impact = estimateImpact({
          totalBudget,
          contractAmount,
          changePct: latestMom,
          exposureRate: config.exposureRate,
          indirectRate,
        });

        await prisma.projectProfitImpact.upsert({
          where: {
            projectId_alertId: {
              projectId: project.id,
              alertId: alert.id,
            },
          },
          update: {
            seriesKey: config.seriesKey,
            period: latestPoint.period,
            costDelta: impact.costDelta,
            indirectDelta: impact.indirectDelta,
            totalDelta: impact.totalDelta,
            projectedProfit: impact.projectedProfit,
            projectedProfitRate: impact.projectedProfitRate,
            triggeredAt: new Date(),
          },
          create: {
            projectId: project.id,
            alertId: alert.id,
            seriesKey: config.seriesKey,
            period: latestPoint.period,
            costDelta: impact.costDelta,
            indirectDelta: impact.indirectDelta,
            totalDelta: impact.totalDelta,
            projectedProfit: impact.projectedProfit,
            projectedProfitRate: impact.projectedProfitRate,
            triggeredAt: new Date(),
          },
        });
        impactsUpserted += 1;
      }
    }

    seriesResults.push({
      seriesKey: config.seriesKey,
      period: latestPoint?.period ?? null,
      value: latestPoint?.value ?? null,
      momChangePct: latestMom,
      triggered: shouldTrigger,
    });
  }

  return {
    fetchedAt,
    snapshotsUpserted,
    alertsTriggered,
    impactsUpserted,
    series: seriesResults,
  };
}

