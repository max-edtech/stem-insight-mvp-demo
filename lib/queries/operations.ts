import { prisma } from "@/lib/prisma";

export interface OperationChangeOrder {
  id: string;
  orderNo: string;
  title: string;
  deltaAmount: number;
  status: string;
  approvedAt: string | null;
  note: string | null;
}

export interface OperationCashflowEntry {
  id: string;
  itemCode: string | null;
  itemName: string | null;
  mainCategory: string | null;
  subCategory: string | null;
  amount: number;
  cashAmount: number;
  startDate: string | null;
  endDate: string | null;
  note: string | null;
}

export interface OperationTaxScenario {
  id: string;
  title: string;
  taxableProfit: number;
  taxRate: number;
  estimatedTax: number;
  status: string;
  note: string | null;
}

export interface OperationOverview {
  project: {
    id: string;
    name: string;
    contractAmount: number;
    totalBudget: number;
    targetProfitRate: number;
  } | null;
  changeOrders: OperationChangeOrder[];
  billingEntries: OperationCashflowEntry[];
  collectionEntries: OperationCashflowEntry[];
  taxScenarios: OperationTaxScenario[];
  summary: {
    approvedChangeAmount: number;
    pendingChangeAmount: number;
    billedAmount: number;
    collectedAmount: number;
    outstandingBilling: number;
    latestEstimatedTax: number;
    latestAfterTaxProfit: number;
    currentProfit: number;
  };
}

function toAmount(value: number | null | undefined) {
  return Number(value || 0);
}

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

export async function getOperationsOverview(projectId: string): Promise<OperationOverview> {
  const [project, changeOrders, billingEntries, collectionEntries, taxScenarios] = await Promise.all([
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
    prisma.changeOrder.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.cashflowEntry.findMany({
      where: { projectId, mainCategory: "請款" },
      orderBy: [{ startDate: "desc" }, { sortOrder: "asc" }, { id: "desc" }],
    }),
    prisma.cashflowEntry.findMany({
      where: { projectId, mainCategory: "回款" },
      orderBy: [{ startDate: "desc" }, { sortOrder: "asc" }, { id: "desc" }],
    }),
    prisma.taxScenario.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  const approvedChangeAmount = changeOrders
    .filter((item) => item.status === "approved")
    .reduce((sum, item) => sum + toAmount(item.deltaAmount), 0);

  const pendingChangeAmount = changeOrders
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + toAmount(item.deltaAmount), 0);

  const billedAmount = billingEntries.reduce((sum, item) => sum + toAmount(item.amount), 0);
  const collectedAmount = collectionEntries.reduce((sum, item) => sum + toAmount(item.amount), 0);
  const outstandingBilling = Math.max(0, billedAmount - collectedAmount);

  const currentProfit = project
    ? toAmount(project.contractAmount) - toAmount(project.totalBudget)
    : 0;
  const latestScenario = taxScenarios[0];
  const latestEstimatedTax = latestScenario ? toAmount(latestScenario.estimatedTax) : 0;
  const latestAfterTaxProfit = Math.max(0, currentProfit - latestEstimatedTax);

  return {
    project: project
      ? {
          id: project.id,
          name: project.name,
          contractAmount: toAmount(project.contractAmount),
          totalBudget: toAmount(project.totalBudget),
          targetProfitRate: toAmount(project.targetProfitRate),
        }
      : null,
    changeOrders: changeOrders.map((item) => ({
      id: item.id,
      orderNo: item.orderNo,
      title: item.title,
      deltaAmount: toAmount(item.deltaAmount),
      status: item.status,
      approvedAt: toIso(item.approvedAt),
      note: item.note,
    })),
    billingEntries: billingEntries.map((item) => ({
      id: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      mainCategory: item.mainCategory,
      subCategory: item.subCategory,
      amount: toAmount(item.amount),
      cashAmount: toAmount(item.cashAmount),
      startDate: toIso(item.startDate),
      endDate: toIso(item.endDate),
      note: item.note ?? null,
    })),
    collectionEntries: collectionEntries.map((item) => ({
      id: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      mainCategory: item.mainCategory,
      subCategory: item.subCategory,
      amount: toAmount(item.amount),
      cashAmount: toAmount(item.cashAmount),
      startDate: toIso(item.startDate),
      endDate: toIso(item.endDate),
      note: item.note ?? null,
    })),
    taxScenarios: taxScenarios.map((item) => ({
      id: item.id,
      title: item.title,
      taxableProfit: toAmount(item.taxableProfit),
      taxRate: toAmount(item.taxRate),
      estimatedTax: toAmount(item.estimatedTax),
      status: item.status,
      note: item.note,
    })),
    summary: {
      approvedChangeAmount,
      pendingChangeAmount,
      billedAmount,
      collectedAmount,
      outstandingBilling,
      latestEstimatedTax,
      latestAfterTaxProfit,
      currentProfit,
    },
  };
}
