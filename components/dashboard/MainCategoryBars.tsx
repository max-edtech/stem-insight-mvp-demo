"use client";

import { formatAmount } from "@/lib/formatters";
import { CATEGORY_COLORS } from "@/lib/types";
import type { ProjectSummary } from "@/lib/types";

export function MainCategoryBars({ data }: { data: ProjectSummary[] }) {
  const max = Math.max(...data.map((d) => d.total_amount), 1);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">各工程預算佔比</h2>
      <div className="space-y-2.5">
        {data.map((row) => {
          const pct = (row.total_amount / max) * 100;
          const color = CATEGORY_COLORS[row.main_category] ?? "#94a3b8";
          return (
            <div key={row.main_category}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-gray-700 font-medium truncate max-w-[130px]">
                  {row.main_category}
                </span>
                <span className="text-xs text-gray-500 shrink-0 ml-2">
                  {formatAmount(row.total_amount)}{" "}
                  <span className="text-gray-400">
                    {Number(row.budget_pct).toFixed(1)}%
                  </span>
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
