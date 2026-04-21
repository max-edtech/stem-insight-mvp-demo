import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getMainSummary, getMaterialExposure, getProjectForecast } from "@/lib/queries/dashboard";
import { getBudgetVsActual } from "@/lib/queries/budget-compare";
import { getSchedule } from "@/lib/queries/schedule";
import { getAcceptanceReadiness } from "@/lib/queries/acceptance";

function dateText(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ message: "Project not found" }, { status: 404 });
  }

  const [
    summary,
    materials,
    forecast,
    acceptance,
    compareRows,
    schedule,
    budgetCodes,
    budgetLines,
    actualValuations,
    cashflowEntries,
    changeOrders,
    taxScenarios,
  ] = await Promise.all([
    getMainSummary(projectId),
    getMaterialExposure(projectId),
    getProjectForecast(projectId),
    getAcceptanceReadiness(projectId),
    getBudgetVsActual(projectId),
    getSchedule(projectId),
    prisma.budgetCode.findMany({
      where: { projectId },
      orderBy: [{ mainCategory: "asc" }, { code: "asc" }],
    }),
    prisma.budgetLine.findMany({
      where: { projectId },
      include: { budgetCodeR: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.actualValuation.findMany({
      where: { projectId },
      include: { budgetCodeR: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.cashflowEntry.findMany({
      where: { projectId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.changeOrder.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.taxScenario.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      {
        projectId: project.id,
        projectName: project.name,
        contractAmount: project.contractAmount,
        totalBudget: project.totalBudget,
        targetProfitRate: project.targetProfitRate,
        totalDays: project.totalDays,
        startDate: dateText(project.startDate),
        endDate: dateText(project.endDate),
        createdAt: dateText(project.createdAt),
        updatedAt: dateText(project.updatedAt),
      },
    ]),
    "專案摘要"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      budgetCodes.map((item) => ({
        code: item.code,
        name: item.name,
        mainCategory: item.mainCategory,
        subCategory: item.subCategory,
      }))
    ),
    "預算碼"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      budgetLines.map((item) => ({
        mainCategory: item.budgetCodeR.mainCategory,
        subCategory: item.budgetCodeR.subCategory,
        budgetCode: item.budgetCode,
        itemName: item.itemName,
        itemCode: item.itemCode ?? "",
        unit: item.unit ?? "",
        unitUsage: item.unitUsage ?? "",
        quantity: item.quantity ?? "",
        unitPrice: item.unitPrice ?? "",
        lineTotal: item.lineTotal ?? "",
        budgetTotal: item.budgetTotal ?? "",
        isSummary: item.isSummary ? "Y" : "N",
        remark: item.remark ?? "",
      }))
    ),
    "預算表"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      actualValuations.map((item) => ({
        mainCategory: item.budgetCodeR.mainCategory,
        subCategory: item.budgetCodeR.subCategory,
        budgetCode: item.budgetCode,
        itemName: item.itemName,
        itemCode: item.itemCode ?? "",
        unit: item.unit ?? "",
        quantity: item.quantity ?? "",
        unitPrice: item.unitPrice ?? "",
        amount: item.amount ?? "",
        budgetRatio: item.budgetRatio ?? "",
        remark: item.remark ?? "",
      }))
    ),
    "A案計價"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      schedule.map((item) => ({
        itemCode: item.itemCode ?? "",
        milestoneName: item.milestoneName,
        milestoneDate: item.milestoneDate ?? "",
        durationDays: item.durationDays ?? "",
        startDate: item.startDate ?? "",
        endDate: item.endDate ?? "",
        remark: item.remark ?? "",
      }))
    ),
    "進度表"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      cashflowEntries.map((item) => ({
        itemCode: item.itemCode ?? "",
        itemName: item.itemName ?? "",
        mainCategory: item.mainCategory ?? "",
        subCategory: item.subCategory ?? "",
        amount: item.amount ?? "",
        durationDays: item.durationDays ?? "",
        startDate: item.startDate ?? "",
        endDate: item.endDate ?? "",
        cashAmount: item.cashAmount ?? "",
        noteStartDate: item.noteStartDate ?? "",
        noteEndDate: item.noteEndDate ?? "",
        noteAmount: item.noteAmount ?? "",
        depositDate: item.depositDate ?? "",
        depositAmount: item.depositAmount ?? "",
        retentionDate: item.retentionDate ?? "",
        retentionAmount: item.retentionAmount ?? "",
        note: item.note ?? "",
      }))
    ),
    "現金流"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      changeOrders.map((item) => ({
        orderNo: item.orderNo,
        title: item.title,
        deltaAmount: item.deltaAmount,
        status: item.status,
        approvedAt: dateText(item.approvedAt),
        note: item.note ?? "",
      }))
    ),
    "變更單"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      taxScenarios.map((item) => ({
        title: item.title,
        taxableProfit: item.taxableProfit,
        taxRate: item.taxRate,
        estimatedTax: item.estimatedTax,
        status: item.status,
        note: item.note ?? "",
      }))
    ),
    "稅務情境"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      summary.map((item) => ({
        mainCategory: item.main_category,
        totalAmount: item.total_amount,
        budgetPct: item.budget_pct,
        codeCount: item.code_count,
      }))
    ),
    "主項彙總"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      compareRows.map((item) => ({
        mainCategory: item.main_category,
        budgetAmount: item.budget_amount,
        actualAmount: item.actual_amount,
        variance: item.variance,
        variancePct: item.variance_pct,
      }))
    ),
    "預算比對"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      materials.map((item) => ({
        label: item.label,
        key: item.key,
        totalAmount: item.totalAmount,
      }))
    ),
    "材料暴露"
  );

  if (forecast) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        {
          currentActual: forecast.currentActual,
          progressRate: forecast.progressRate,
          predictedTotalCost: forecast.predictedTotalCost,
          predictedProfit: forecast.predictedProfit,
          predictedProfitRate: forecast.predictedProfitRate,
          riskAmount: forecast.riskAmount,
        },
      ]),
      "EAC預測"
    );
  }

  if (acceptance) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        {
          autoDecision: acceptance.autoDecision,
          passCount: acceptance.passCount,
          totalChecks: acceptance.totalChecks,
          requiredAllPassed: acceptance.requiredAllPassed ? "Y" : "N",
          approvedChangeCount: acceptance.metrics.approvedChangeCount,
          billingCount: acceptance.metrics.billingCount,
          collectionCount: acceptance.metrics.collectionCount,
          taxScenarioCount: acceptance.metrics.taxScenarioCount,
          nonZeroActualCount: acceptance.metrics.nonZeroActualCount,
          totalVariance: acceptance.metrics.totalVariance,
          outstandingBilling: acceptance.metrics.outstandingBilling,
          predictedProfitRate: acceptance.metrics.predictedProfitRate ?? "",
          signedDecision: acceptance.review?.decision ?? "",
          signedMeetingDate: acceptance.review?.meetingDate ?? "",
          signedOwner: acceptance.review?.ownerName ?? "",
          signedReviewer: acceptance.review?.reviewerName ?? "",
          signedUpdatedAt: acceptance.review?.updatedAt ?? "",
        },
      ]),
      "驗收總表"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        acceptance.checks.map((item) => ({
          checkKey: item.key,
          title: item.title,
          required: item.required ? "Y" : "N",
          status: item.passed ? "Pass" : "Fail",
          detail: item.detail,
        }))
      ),
      "驗收矩陣"
    );
  }

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
  const filename = `finance-hub-${projectId}.xlsx`;

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
