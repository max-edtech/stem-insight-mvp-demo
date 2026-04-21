import { prisma } from "@/lib/prisma";
import type { BudgetVsActualRow } from "@/lib/types";

export async function getBudgetVsActual(projectId: string): Promise<BudgetVsActualRow[]> {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT
      bc_list.main_category,
      ${projectId} AS project_id,
      COALESCE(budget.total, 0) AS budget_amount,
      COALESCE(actual.total, 0) AS actual_amount
    FROM (
      SELECT DISTINCT main_category FROM budget_codes WHERE project_id = ${projectId}
    ) bc_list
    LEFT JOIN (
      SELECT bcd.main_category, SUM(bl.budget_total) AS total
      FROM budget_lines bl
      JOIN budget_codes bcd ON bl.budget_code_id = bcd.id
      WHERE bl.is_summary = 1 AND bl.project_id = ${projectId}
      GROUP BY bcd.main_category
    ) budget ON budget.main_category = bc_list.main_category
    LEFT JOIN (
      SELECT bcd.main_category, SUM(av.amount) AS total
      FROM actual_valuations av
      JOIN budget_codes bcd ON av.budget_code_id = bcd.id
      WHERE av.project_id = ${projectId}
      GROUP BY bcd.main_category
    ) actual ON actual.main_category = bc_list.main_category
    ORDER BY budget_amount DESC
  `;

  return rows.map(r => {
    const budget = Number(r.budget_amount);
    const actual = Number(r.actual_amount);
    return {
      main_category: r.main_category,
      project_id: r.project_id,
      budget_amount: budget,
      actual_amount: actual,
      variance: actual - budget,
      variance_pct: budget > 0 ? Number(((actual / budget) * 100).toFixed(2)) : 0
    };
  });
}
