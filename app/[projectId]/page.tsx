export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { FinanceHubClient } from "@/components/dashboard/FinanceHubClient";
import {
  getProject,
  getMainSummary,
  getMaterialExposure,
  getProjectForecast,
} from "@/lib/queries/dashboard";
import {
  getLatestMarketSignals,
  getProjectLatestMarketImpacts,
} from "@/lib/queries/market";
import { getOperationsOverview } from "@/lib/queries/operations";
import { getBudgetVsActual } from "@/lib/queries/budget-compare";
import { getSchedule } from "@/lib/queries/schedule";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/formatters";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [
    project,
    summary,
    materials,
    forecast,
    compareRows,
    schedule,
    coverage,
    operations,
    marketSignals,
    marketImpacts,
  ] = await Promise.all([
    getProject(projectId),
    getMainSummary(projectId),
    getMaterialExposure(projectId),
    getProjectForecast(projectId),
    getBudgetVsActual(projectId),
    getSchedule(projectId),
    Promise.all([
      prisma.budgetCode.count({ where: { projectId } }),
      prisma.budgetLine.count({ where: { projectId } }),
      prisma.actualValuation.count({ where: { projectId } }),
      prisma.scheduleItem.count({ where: { projectId } }),
      prisma.cashflowEntry.count({ where: { projectId } }),
      prisma.costItem.count({ where: { projectId } }),
    ]).then(
      ([
        budgetCodes,
        budgetLines,
        actualValuations,
        scheduleItems,
        cashflowEntries,
        costItems,
      ]) => ({
        budgetCodes,
        budgetLines,
        actualValuations,
        scheduleItems,
        cashflowEntries,
        costItems,
      })
    ),
    getOperationsOverview(projectId),
    getLatestMarketSignals(),
    getProjectLatestMarketImpacts(projectId),
  ]);

  if (!project) notFound();

  const projectView = {
    id: project.id,
    name: project.name,
    totalBudget: Number(project.totalBudget || 0),
    contractAmount: Number(project.contractAmount || 0),
    targetProfitRate: Number(project.targetProfitRate || 0),
    totalDays: project.totalDays,
    startDate: project.startDate ? project.startDate.toISOString() : null,
    endDate: project.endDate ? project.endDate.toISOString() : null,
  };

  return (
    <div>
      <PageHeader
        title="開發財務中樞"
        subtitle={
          project.startDate && project.endDate
            ? `${project.name} · ${formatDate(project.startDate)} — ${formatDate(project.endDate)}`
            : undefined
        }
      />
      <FinanceHubClient
        projectId={projectId}
        project={projectView}
        summary={summary}
        materials={materials}
        forecast={forecast}
        compareRows={compareRows}
        schedule={schedule}
        coverage={coverage}
        operationsSummary={operations.summary}
        marketSignals={marketSignals}
        marketImpacts={marketImpacts}
      />
    </div>
  );
}
