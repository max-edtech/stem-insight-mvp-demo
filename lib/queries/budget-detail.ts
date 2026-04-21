import { prisma } from "@/lib/prisma";

export interface BudgetDetailItem {
  id: string;
  budgetCode: string;
  itemName: string;
  mainCategory: string;
  subCategory: string;
  budgetTotal: number | null;
}

export async function getBudgetDetail(
  projectId: string,
  mainCategory?: string
): Promise<BudgetDetailItem[]> {
  const lines = await prisma.budgetLine.findMany({
    where: {
      projectId,
      isSummary: true,
      ...(mainCategory ? { budgetCodeR: { mainCategory } } : {}),
    },
    include: { budgetCodeR: true },
    orderBy: [{ budgetTotal: "desc" }, { sortOrder: "asc" }],
  });

  return lines.map((l) => ({
    id: l.id,
    budgetCode: l.budgetCode,
    itemName: l.itemName,
    mainCategory: l.budgetCodeR.mainCategory,
    subCategory: l.budgetCodeR.subCategory,
    budgetTotal: l.budgetTotal ? Number(l.budgetTotal) : null,
  }));
}
