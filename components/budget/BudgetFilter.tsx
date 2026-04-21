"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetFilterProps {
  categories: string[];
  selected: string;
  search: string;
  onSelect: (cat: string) => void;
  onSearch: (q: string) => void;
}

export function BudgetFilter({ categories, selected, search, onSelect, onSearch }: BudgetFilterProps) {
  return (
    <div className="space-y-3 px-4 py-3 bg-white border-b border-gray-100">
      <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
        {["全部", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              selected === cat
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-gray-50 text-gray-600 border-gray-200"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="搜尋項目名稱..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>
    </div>
  );
}
