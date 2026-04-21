import "server-only";

import { prisma } from "@/lib/prisma";
import {
  CASE_TEMPLATES,
  calculateFeasibility,
  getTemplate,
  type FeasibilityInputs,
  type FeasibilityResult,
} from "@/lib/feasibility";

export interface CaseDraft {
  projectName: string;
  templateId: string;
  startDate: string;
  totalDays: number;
  targetProfitRate: number;
  parameterSnapshotJson: string;
  riskSimulationJson: string;
  inputs: FeasibilityInputs;
}

export interface CaseCreationResult {
  projectId: string;
  projectName: string;
  feasibility: FeasibilityResult;
}

type Blueprint = {
  code: string;
  name: string;
  mainCategory: string;
  subCategory: string;
  amount: (result: FeasibilityResult) => number;
};

const MODULE_BLUEPRINTS: Blueprint[] = [
  {
    code: "LAND",
    name: "土地取得",
    mainCategory: "前期",
    subCategory: "土地",
    amount: (result) => result.totalLandCost,
  },
  {
    code: "BUILD",
    name: "工程成本",
    mainCategory: "中期",
    subCategory: "工程",
    amount: (result) => result.totalBuildCost,
  },
  {
    code: "SOFT",
    name: "軟成本",
    mainCategory: "中期",
    subCategory: "規劃",
    amount: (result) => result.totalSoftCost,
  },
  {
    code: "MKT",
    name: "銷售費用",
    mainCategory: "後期",
    subCategory: "行銷",
    amount: (result) => result.marketingFee,
  },
  {
    code: "ADM",
    name: "管理費用",
    mainCategory: "後期",
    subCategory: "管理",
    amount: (result) => result.adminFee,
  },
  {
    code: "FIN",
    name: "融資成本",
    mainCategory: "後期",
    subCategory: "利息",
    amount: (result) => result.totalInterest,
  },
];

const SCHEDULE_BLUEPRINTS = [
  {
    code: "PREP",
    title: "立案與整備",
    offset: 0,
    durationShare: 0.12,
    remark: "完成基地、條件與資金框架確認",
  },
  {
    code: "DESIGN",
    title: "設計與發包",
    offset: 0.12,
    durationShare: 0.18,
    remark: "完成設計、報批與採發包",
  },
  {
    code: "BUILD",
    title: "主體工程",
    offset: 0.3,
    durationShare: 0.5,
    remark: "施工執行與進度驗收",
  },
  {
    code: "SALES",
    title: "銷售與交屋",
    offset: 0.8,
    durationShare: 0.2,
    remark: "收尾、回款與交屋",
  },
];

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  if (value === null) return fallback;
  const parsed = Number(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePercent(value: FormDataEntryValue | null, fallback = 0) {
  return parseNumber(value, fallback) / 100;
}

function parseDate(value: FormDataEntryValue | null, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(String(value));
  return Number.isFinite(parsed.getTime()) ? parsed : fallback;
}

function parseJsonText(value: FormDataEntryValue | null, fallback = "") {
  if (!value) return fallback;
  const raw = String(value).trim();
  if (!raw) return fallback;
  if (raw.length > 60_000) return fallback;
  try {
    JSON.parse(raw);
    return raw;
  } catch {
    return fallback;
  }
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildDefaultInputs(templateId: string): FeasibilityInputs {
  return getTemplate(templateId).inputs;
}

export function getCaseTemplates() {
  return CASE_TEMPLATES;
}

export function parseCaseDraft(formData: FormData): CaseDraft {
  const templateId = String(formData.get("templateId") ?? CASE_TEMPLATES[0].id);
  const defaults = buildDefaultInputs(templateId);

  return {
    projectName: String(formData.get("projectName") ?? "").trim() || getTemplate(templateId).name,
    templateId,
    startDate: String(formData.get("startDate") ?? ""),
    totalDays: Math.max(1, Math.round(parseNumber(formData.get("totalDays"), Math.round(defaults.finance.duration * 365)))),
    targetProfitRate: parsePercent(formData.get("targetProfitRate"), 0.15),
    parameterSnapshotJson: parseJsonText(formData.get("parameterSnapshotJson"), ""),
    riskSimulationJson: parseJsonText(formData.get("riskSimulationJson"), ""),
    inputs: {
      land: {
        area: parseNumber(formData.get("landArea"), defaults.land.area),
        price: parseNumber(formData.get("landPrice"), defaults.land.price),
        far: parseNumber(formData.get("landFar"), defaults.land.far),
        bonus: parseNumber(formData.get("landBonus"), defaults.land.bonus),
        sellableRatio: parseNumber(formData.get("sellableRatio"), defaults.land.sellableRatio),
        landTaxFeeRate: parsePercent(formData.get("landTaxFeeRate"), defaults.land.landTaxFeeRate),
      },
      cost: {
        unitBuildCost: parseNumber(formData.get("unitBuildCost"), defaults.cost.unitBuildCost),
        softCostRate: parseNumber(formData.get("softCostRate"), defaults.cost.softCostRate),
        marketingRate: parseNumber(formData.get("marketingRate"), defaults.cost.marketingRate),
        adminRate: parseNumber(formData.get("adminRate"), defaults.cost.adminRate),
      },
      finance: {
        landLoanRate: parseNumber(formData.get("landLoanRate"), defaults.finance.landLoanRate),
        constLoanRate: parseNumber(formData.get("constLoanRate"), defaults.finance.constLoanRate),
        interestRate: parseNumber(formData.get("interestRate"), defaults.finance.interestRate),
        duration: parseNumber(formData.get("financeDuration"), defaults.finance.duration),
      },
      sales: {
        expectedPrice: parseNumber(formData.get("expectedPrice"), defaults.sales.expectedPrice),
      },
    },
  };
}

export async function createProjectCase(draft: CaseDraft): Promise<CaseCreationResult> {
  const feasibility = calculateFeasibility(draft.inputs);
  const startDate = parseDate(draft.startDate ? draft.startDate : null, new Date());
  const totalDays = Math.max(1, draft.totalDays);
  const endDate = addDays(startDate, totalDays);
  const targetProfitRate = Number.isFinite(draft.targetProfitRate) ? draft.targetProfitRate : 0.15;

  const project = await prisma.$transaction(async (tx) => {
    const projectRecord = await tx.project.create({
      data: {
        name: draft.projectName,
        totalArea: draft.inputs.land.area,
        unitCost: draft.inputs.cost.unitBuildCost,
        expectedSalesPrice: draft.inputs.sales.expectedPrice,
        contractAmount: feasibility.totalSales,
        targetProfitRate,
        totalBudget: feasibility.totalInvestment,
        parameterSnapshot: draft.parameterSnapshotJson,
        riskSimulation: draft.riskSimulationJson,
        totalDays,
        startDate,
        endDate,
      },
    });

    for (const [index, module] of MODULE_BLUEPRINTS.entries()) {
      const amount = module.amount(feasibility);
      const budgetCode = await tx.budgetCode.create({
        data: {
          projectId: projectRecord.id,
          code: module.code,
          name: module.name,
          mainCategory: module.mainCategory,
          subCategory: module.subCategory,
        },
      });

      const costItem = await tx.costItem.create({
        data: {
          projectId: projectRecord.id,
          itemCode: module.code,
          itemName: module.name,
          unit: "式",
          costType: "預設",
          tradeCode: module.code,
          tradeName: module.name,
          compositeCode: module.code,
        },
      });

      await tx.budgetLine.createMany({
        data: [
          {
            projectId: projectRecord.id,
            budgetCodeId: budgetCode.id,
            costItemId: costItem.id,
            budgetCode: module.code,
            itemCode: module.code,
            itemName: module.name,
            unit: "式",
            unitUsage: 1,
            quantity: 1,
            unitPrice: amount,
            lineTotal: amount,
            budgetTotal: amount,
            isSummary: true,
            sortOrder: index * 2,
          },
          {
            projectId: projectRecord.id,
            budgetCodeId: budgetCode.id,
            costItemId: costItem.id,
            budgetCode: module.code,
            itemCode: `${module.code}-D`,
            itemName: `${module.name}概算明細`,
            unit: "式",
            unitUsage: 1,
            quantity: 1,
            unitPrice: amount,
            lineTotal: amount,
            budgetTotal: amount,
            isSummary: false,
            sortOrder: index * 2 + 1,
          },
        ],
      });
    }

    const scheduleDates = SCHEDULE_BLUEPRINTS.map((blueprint) => {
      const milestoneDate = addDays(startDate, Math.round(totalDays * blueprint.offset));
      const durationDays = Math.max(1, Math.round(totalDays * blueprint.durationShare));
      return {
        itemCode: blueprint.code,
        milestoneName: blueprint.title,
        milestoneDate,
        durationDays,
        startDate: milestoneDate,
        endDate: addDays(milestoneDate, durationDays),
        remark: blueprint.remark,
      };
    });

    const scheduleItems = [];
    for (let index = 0; index < scheduleDates.length; index += 1) {
      const item = await tx.scheduleItem.create({
        data: {
          projectId: projectRecord.id,
          itemCode: scheduleDates[index].itemCode,
          milestoneName: scheduleDates[index].milestoneName,
          milestoneDate: scheduleDates[index].milestoneDate,
          durationDays: scheduleDates[index].durationDays,
          startDate: scheduleDates[index].startDate,
          endDate: scheduleDates[index].endDate,
          remark: scheduleDates[index].remark,
          sortOrder: index,
        },
      });
      scheduleItems.push(item);
    }

    const cashflowBlueprints = [
      {
        scheduleItemId: scheduleItems[0]?.id ?? null,
        itemCode: "LAND-CF",
        itemName: "土地取得與稅費",
        mainCategory: "前期",
        subCategory: "土地",
        amount: feasibility.totalLandCost,
        cashAmount: Math.max(0, feasibility.totalLandCost - feasibility.landLoanAmount),
        noteAmount: feasibility.landLoanAmount,
      },
      {
        scheduleItemId: scheduleItems[1]?.id ?? null,
        itemCode: "BUILD-CF",
        itemName: "工程與軟成本",
        mainCategory: "中期",
        subCategory: "工程",
        amount: feasibility.totalBuildCost + feasibility.totalSoftCost,
        cashAmount: Math.max(0, feasibility.totalBuildCost - feasibility.constLoanAmount + feasibility.totalSoftCost),
        noteAmount: feasibility.constLoanAmount,
      },
      {
        scheduleItemId: scheduleItems[2]?.id ?? null,
        itemCode: "FIN-CF",
        itemName: "銷售與融資費用",
        mainCategory: "後期",
        subCategory: "費用",
        amount: feasibility.marketingFee + feasibility.adminFee + feasibility.totalInterest,
        cashAmount: feasibility.marketingFee + feasibility.adminFee + feasibility.totalInterest,
        noteAmount: 0,
      },
      {
        scheduleItemId: scheduleItems[3]?.id ?? null,
        itemCode: "SALE-CF",
        itemName: "預估銷售回款",
        mainCategory: "回款",
        subCategory: "收入",
        amount: feasibility.totalSales,
        cashAmount: feasibility.totalSales,
        noteAmount: 0,
      },
    ] as const;

    for (const [index, entry] of cashflowBlueprints.entries()) {
      await tx.cashflowEntry.create({
        data: {
          projectId: projectRecord.id,
          scheduleItemId: entry.scheduleItemId ?? undefined,
          itemCode: entry.itemCode,
          itemName: entry.itemName,
          mainCategory: entry.mainCategory,
          subCategory: entry.subCategory,
          amount: entry.amount,
          startDate: index === 0 ? startDate : addDays(startDate, Math.round(totalDays * (index / cashflowBlueprints.length))),
          endDate: index === cashflowBlueprints.length - 1 ? endDate : addDays(startDate, Math.round(totalDays * ((index + 1) / cashflowBlueprints.length))),
          cashAmount: entry.cashAmount,
          noteAmount: entry.noteAmount,
          sortOrder: index,
        },
      });
    }

    return projectRecord;
  });

  return {
    projectId: project.id,
    projectName: project.name,
    feasibility,
  };
}
