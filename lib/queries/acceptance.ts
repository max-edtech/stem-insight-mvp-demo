import { prisma } from "@/lib/prisma";
import { getBudgetVsActual } from "@/lib/queries/budget-compare";
import { getProjectForecast } from "@/lib/queries/dashboard";
import { getOperationsOverview } from "@/lib/queries/operations";

export interface AcceptanceCheck {
  key: string;
  title: string;
  passed: boolean;
  required: boolean;
  detail: string;
}

export interface AcceptanceReviewSnapshot {
  meetingDate: string | null;
  ownerName: string;
  reviewerName: string;
  decision: "go" | "revise";
  feasibilityPass: boolean;
  changePass: boolean;
  variancePass: boolean;
  cashflowPass: boolean;
  taxPass: boolean;
  exportPass: boolean;
  notes: string;
  updatedAt: string;
}

export interface AcceptanceReadiness {
  project: {
    id: string;
    name: string;
    contractAmount: number;
    totalBudget: number;
    targetProfitRate: number;
  };
  checks: AcceptanceCheck[];
  passCount: number;
  totalChecks: number;
  requiredAllPassed: boolean;
  autoDecision: "go" | "revise";
  metrics: {
    approvedChangeCount: number;
    billingCount: number;
    collectionCount: number;
    taxScenarioCount: number;
    nonZeroActualCount: number;
    compareCategoryCount: number;
    totalVariance: number;
    scheduleCount: number;
    cashflowCount: number;
    budgetLineCount: number;
    outstandingBilling: number;
    predictedProfitRate: number | null;
  };
  review: AcceptanceReviewSnapshot | null;
}

function toAmount(value: number | null | undefined) {
  return Number(value || 0);
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function getAcceptanceReadiness(
  projectId: string
): Promise<AcceptanceReadiness | null> {
  const [project, forecast, operations, compareRows, nonZeroActualCount, scheduleCount, cashflowCount, budgetLineCount, review] =
    await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          contractAmount: true,
          totalBudget: true,
          targetProfitRate: true,
        },
      }),
      getProjectForecast(projectId),
      getOperationsOverview(projectId),
      getBudgetVsActual(projectId),
      prisma.actualValuation.count({
        where: { projectId, amount: { not: 0 } },
      }),
      prisma.scheduleItem.count({ where: { projectId } }),
      prisma.cashflowEntry.count({ where: { projectId } }),
      prisma.budgetLine.count({ where: { projectId } }),
      prisma.acceptanceReview.findUnique({ where: { projectId } }),
    ]);

  if (!project) return null;

  const approvedChangeCount = operations.changeOrders.filter((item) => item.status === "approved").length;
  const billingCount = operations.billingEntries.length;
  const collectionCount = operations.collectionEntries.length;
  const taxScenarioCount = operations.taxScenarios.length;
  const compareCategoryCount = compareRows.length;
  const totalVariance = compareRows.reduce((sum, row) => sum + row.variance, 0);
  const predictedProfitRate = forecast?.predictedProfitRate ?? null;

  const checks: AcceptanceCheck[] = [
    {
      key: "feasibility",
      title: "前期試算可用",
      passed: toAmount(project.contractAmount) > 0 && toAmount(project.totalBudget) > 0,
      required: false,
      detail:
        predictedProfitRate === null
          ? "已有專案收入與預算基準，可展示試算核心。"
          : `EAC 預測利潤率 ${predictedProfitRate.toFixed(1)}%。`,
    },
    {
      key: "change",
      title: "變更回寫可驗證",
      passed: approvedChangeCount > 0,
      required: true,
      detail: `已核准變更單 ${approvedChangeCount} 筆。`,
    },
    {
      key: "variance",
      title: "差異分析可定位",
      passed: compareCategoryCount > 0,
      required: false,
      detail: `主項差異 ${compareCategoryCount} 類，合計差異 ${Math.round(totalVariance).toLocaleString()}。`,
    },
    {
      key: "cashflow",
      title: "請款/回款可追蹤",
      passed: billingCount > 0 && collectionCount > 0,
      required: true,
      detail: `請款 ${billingCount} 筆、回款 ${collectionCount} 筆，缺口 ${Math.round(
        operations.summary.outstandingBilling
      ).toLocaleString()}。`,
    },
    {
      key: "tax",
      title: "稅後獲利可呈現",
      passed: taxScenarioCount > 0,
      required: true,
      detail: `稅務情境 ${taxScenarioCount} 筆，最近稅後獲利 ${Math.round(
        operations.summary.latestAfterTaxProfit
      ).toLocaleString()}。`,
    },
    {
      key: "export",
      title: "報表匯出可交付",
      passed: budgetLineCount > 0 && scheduleCount > 0 && cashflowCount > 0,
      required: false,
      detail: `預算 ${budgetLineCount}、進度 ${scheduleCount}、現金流 ${cashflowCount}。`,
    },
  ];

  const passCount = checks.filter((check) => check.passed).length;
  const requiredAllPassed = checks.filter((check) => check.required).every((check) => check.passed);
  const autoDecision: "go" | "revise" = passCount >= 5 && requiredAllPassed ? "go" : "revise";

  return {
    project: {
      id: project.id,
      name: project.name,
      contractAmount: toAmount(project.contractAmount),
      totalBudget: toAmount(project.totalBudget),
      targetProfitRate: toAmount(project.targetProfitRate),
    },
    checks,
    passCount,
    totalChecks: checks.length,
    requiredAllPassed,
    autoDecision,
    metrics: {
      approvedChangeCount,
      billingCount,
      collectionCount,
      taxScenarioCount,
      nonZeroActualCount,
      compareCategoryCount,
      totalVariance,
      scheduleCount,
      cashflowCount,
      budgetLineCount,
      outstandingBilling: operations.summary.outstandingBilling,
      predictedProfitRate,
    },
    review: review
      ? {
          meetingDate: toIso(review.meetingDate),
          ownerName: review.ownerName ?? "",
          reviewerName: review.reviewerName ?? "",
          decision: review.decision === "go" ? "go" : "revise",
          feasibilityPass: review.feasibilityPass,
          changePass: review.changePass,
          variancePass: review.variancePass,
          cashflowPass: review.cashflowPass,
          taxPass: review.taxPass,
          exportPass: review.exportPass,
          notes: review.notes ?? "",
          updatedAt: review.updatedAt.toISOString(),
        }
      : null,
  };
}
