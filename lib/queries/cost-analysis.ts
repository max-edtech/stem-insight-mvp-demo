import { prisma } from "@/lib/prisma";
import type { CostAnalysisRow } from "@/lib/types";

export async function getCostAnalysis(projectId: string): Promise<CostAnalysisRow[]> {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT
      bl.project_id,
      bc.main_category,
      bc.sub_category,
      SUM(bl.budget_total) AS total_amount,
      COUNT(DISTINCT bl.budget_code) AS item_count
    FROM budget_lines bl
    JOIN budget_codes bc ON bl.budget_code_id = bc.id
    WHERE bl.is_summary = 1
      AND bl.project_id = ${projectId}
    GROUP BY bl.project_id, bc.main_category, bc.sub_category
    ORDER BY total_amount DESC
  `;
  
  return rows.map(r => ({
    project_id: r.project_id,
    main_category: r.main_category,
    sub_category: r.sub_category,
    total_amount: Number(r.total_amount),
    item_count: Number(r.item_count)
  }));
}
