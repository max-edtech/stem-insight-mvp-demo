export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CompareCard } from "@/components/compare/CompareCard";
import { getBudgetVsActual } from "@/lib/queries/budget-compare";
import { formatAmount } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [rows, project] = await Promise.all([
    getBudgetVsActual(projectId),
    prisma.project.findUnique({ where: { id: projectId } }),
  ]);
  if (!project) notFound();

  const totalVariance = rows.reduce((sum, r) => sum + r.variance, 0);

  return (
    <div>
      <PageHeader title="預算 vs 變更差異" />
      <div className="px-4 py-3">
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
            原預算
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
            實支/扣減
          </span>
          <span className="ml-auto font-semibold text-gray-900">
            合計差異:{" "}
            <span className={totalVariance < 0 ? "text-red-500" : "text-green-600"}>
              {formatAmount(totalVariance)}
            </span>
          </span>
        </div>
        <div className="space-y-3">
          {rows.map((row) => (
            <CompareCard key={row.main_category} row={row} />
          ))}
        </div>
      </div>
    </div>
  );
}
