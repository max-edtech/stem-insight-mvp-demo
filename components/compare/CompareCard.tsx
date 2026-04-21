import { formatAmount } from "@/lib/formatters";
import { CATEGORY_COLORS } from "@/lib/types";
import type { BudgetVsActualRow } from "@/lib/types";

export function CompareCard({ row }: { row: BudgetVsActualRow }) {
  const color = CATEGORY_COLORS[row.main_category] ?? "#94a3b8";
  const maxValue = Math.max(row.budget_amount, Math.abs(row.actual_amount), 1);
  const budgetPct = Math.min(100, (row.budget_amount / maxValue) * 100);
  const actualPct = Math.min(100, (Math.abs(row.actual_amount) / maxValue) * 100);
  const isNegative = row.variance < 0;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div
            className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 mb-0.5"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-semibold text-gray-900">{row.main_category}</span>
        </div>
        <span
          className={`text-sm font-bold ${isNegative ? "text-red-500" : "text-green-600"}`}
        >
          {isNegative ? "" : "+"}
          {formatAmount(row.variance)}
        </span>
      </div>

      <div className="space-y-1.5 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>原預算</span>
          <span className="text-gray-900 font-medium">{formatAmount(row.budget_amount)}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${budgetPct}%`, backgroundColor: color }} />
        </div>

        <div className="flex justify-between">
          <span>實支/扣減</span>
          <span className={`font-medium ${isNegative ? "text-red-500" : "text-gray-900"}`}>
            {formatAmount(row.actual_amount)}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${actualPct}%`,
              backgroundColor: isNegative ? "#ef4444" : "#22c55e",
            }}
          />
        </div>

        <div className="flex justify-between pt-1">
          <span>差異率</span>
          <span className={`font-semibold ${isNegative ? "text-red-500" : "text-green-600"}`}>
            {isNegative ? "" : "+"}
            {Number(row.variance_pct).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
