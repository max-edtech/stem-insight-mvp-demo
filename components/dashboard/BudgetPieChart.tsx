"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatAmount } from "@/lib/formatters";
import { CATEGORY_COLORS } from "@/lib/types";
import type { ProjectSummary } from "@/lib/types";

export function BudgetPieChart({ data }: { data: ProjectSummary[] }) {
  const chartData = data.map((d) => ({
    name: d.main_category,
    value: Math.round(d.total_amount),
    color: CATEGORY_COLORS[d.main_category] ?? "#94a3b8",
  }));

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h2 className="text-sm font-semibold text-gray-700 mb-2">預算佔比圓餅</h2>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [formatAmount(Number(value ?? 0)), "金額"]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: 11, color: "#374151" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
