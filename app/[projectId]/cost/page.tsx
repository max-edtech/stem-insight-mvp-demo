"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CategoryFilter } from "@/components/cost/CategoryFilter";
import { SubCategoryBars } from "@/components/cost/SubCategoryBars";
import type { CostAnalysisRow } from "@/lib/types";

export default function CostPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [data, setData] = useState<CostAnalysisRow[]>([]);
  const [selected, setSelected] = useState("全部");

  useEffect(() => {
    fetch(`/api/projects/${projectId}/cost`)
      .then((r) => r.json())
      .then(setData);
  }, [projectId]);

  const categories = [...new Set(data.map((d) => d.main_category))];
  const filtered =
    selected === "全部" ? data : data.filter((d) => d.main_category === selected);

  return (
    <div>
      <PageHeader title="造價分析" />
      <div className="py-3">
        <CategoryFilter
          categories={categories}
          selected={selected}
          onSelect={setSelected}
        />
      </div>
      <SubCategoryBars data={filtered} />
    </div>
  );
}
