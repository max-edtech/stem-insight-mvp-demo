"use client";

import { formatAmount } from "@/lib/formatters";
import { CATEGORY_COLORS } from "@/lib/types";
import type { CostAnalysisRow } from "@/lib/types";

export function SubCategoryBars({ data }: { data: CostAnalysisRow[] }) {
  const max = Math.max(...data.map((d) => d.total_amount), 1);

  return (
    <div className="space-y-3 px-4">
      {data.map((row) => {
        const pct = (row.total_amount / max) * 100;
        const color = CATEGORY_COLORS[row.main_category] ?? "#94a3b8";
        return (
          <div key={`${row.main_category}-${row.sub_category}`} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-baseline mb-2">
              <div>
                <span className="text-sm font-semibold text-gray-900">
                  {row.sub_category}
                </span>
                <span className="text-xs text-gray-400 ml-2">{row.main_category}</span>
              </div>
              <span className="text-sm font-bold text-gray-900 shrink-0">
                {formatAmount(row.total_amount)}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
