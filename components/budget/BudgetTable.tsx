"use client";

import { useState, useMemo } from "react";
import { BudgetFilter } from "./BudgetFilter";
import { formatAmount } from "@/lib/formatters";
import { CATEGORY_COLORS } from "@/lib/types";
import type { BudgetDetailItem } from "@/lib/queries/budget-detail";

export function BudgetTable({
  items,
  categories,
}: {
  items: BudgetDetailItem[];
  categories: string[];
}) {
  const [selected, setSelected] = useState("全部");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selected === "全部" || item.mainCategory === selected;
      const matchSearch =
        !search ||
        item.itemName.includes(search) ||
        item.budgetCode.includes(search);
      return matchCat && matchSearch;
    });
  }, [items, selected, search]);

  return (
    <div>
      <BudgetFilter
        categories={categories}
        selected={selected}
        search={search}
        onSelect={setSelected}
        onSearch={setSearch}
      />
      <div className="space-y-2 p-4">
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 py-12 text-sm">無符合結果</div>
        )}
        {filtered.map((item) => {
          const color = CATEGORY_COLORS[item.mainCategory] ?? "#94a3b8";
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm leading-snug">
                    {item.itemName}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span>
                      {item.mainCategory} › {item.subCategory}
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 mt-0.5">{item.budgetCode}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-bold text-gray-900">
                    {item.budgetTotal ? formatAmount(item.budgetTotal) : "—"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
