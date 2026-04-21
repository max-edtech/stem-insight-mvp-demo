import { prisma } from "@/lib/prisma";
import type { ProjectSummary } from "@/lib/types";

export async function getProject(projectId: string) {
  return prisma.project.findUnique({ where: { id: projectId } });
}

export async function getMainSummary(projectId: string): Promise<ProjectSummary[]> {
  // SQLite version (avoiding Postgres-specific casts)
  const rows = await prisma.$queryRaw<any[]>`
    SELECT
      bl.project_id,
      bc.main_category,
      SUM(bl.budget_total) AS total_amount,
      COUNT(DISTINCT bl.budget_code) AS code_count
    FROM budget_lines bl
    JOIN budget_codes bc ON bl.budget_code_id = bc.id
    WHERE bl.is_summary = 1
      AND bl.project_id = ${projectId}
    GROUP BY bl.project_id, bc.main_category
    ORDER BY total_amount DESC
  `;

  const project = await getProject(projectId);
  const totalBudget = project?.totalBudget || 1;

  return rows.map(r => ({
    project_id: r.project_id,
    main_category: r.main_category,
    total_amount: Number(r.total_amount),
    budget_pct: Number(((r.total_amount / totalBudget) * 100).toFixed(2)),
    code_count: Number(r.code_count)
  }));
}

export async function getProjectForecast(projectId: string) {
  const project = await getProject(projectId);
  if (!project) return null;

  const totalBudget = Number(project.totalBudget);
  const contractAmount = Number(project.contractAmount);

  // 1. Calculate current actual spend
  const actualSum = await prisma.actualValuation.aggregate({
    where: { projectId },
    _sum: { amount: true }
  });
  const currentActual = Number(actualSum._sum.amount || 0);

  // 2. Calculate execution rate (based on number of items with actuals)
  const totalItems = await prisma.budgetLine.count({ where: { projectId, isSummary: true } });
  const actualItems = await prisma.actualValuation.count({
    where: { projectId, amount: { not: 0 } }
  });
  const progressRate = totalItems > 0 ? actualItems / totalItems : 0;

  // 3. Simple Trend Prediction: EAC (Estimate At Completion)
  // If we spent X on Y% of items, we might spend X/Y% on total
  let predictedTotalCost = totalBudget;
  if (progressRate > 0.05) { // Only predict if we have enough data
    predictedTotalCost = currentActual / progressRate;
  }

  const predictedProfit = contractAmount - predictedTotalCost;
  const predictedProfitRate = contractAmount > 0 ? (predictedProfit / contractAmount) * 100 : 0;

  return {
    currentActual,
    progressRate: Number((progressRate * 100).toFixed(1)),
    predictedTotalCost: Math.round(predictedTotalCost),
    predictedProfit: Math.round(predictedProfit),
    predictedProfitRate: Number(predictedProfitRate.toFixed(1)),
    riskAmount: Math.round(predictedTotalCost - totalBudget)
  };
}

export async function getMaterialExposure(projectId: string) {
  // Identify top materials by keyword in budget lines
  const materials = [
    { key: 'steel', label: '鋼筋', keywords: ['鋼筋', '鋼棒'] },
    { key: 'concrete', label: '混凝土', keywords: ['混凝土', 'PSI'] },
    { key: 'formwork', label: '模板', keywords: ['模板', '鷹架'] }
  ];

  const results = await Promise.all(materials.map(async (m) => {
    const sum = await prisma.budgetLine.aggregate({
      where: {
        projectId,
        isSummary: false,
        OR: m.keywords.map(k => ({ itemName: { contains: k } }))
      },
      _sum: { lineTotal: true }
    });
    return {
      key: m.key,
      label: m.label,
      totalAmount: Number(sum._sum.lineTotal || 0)
    };
  }));

  return results;
}
