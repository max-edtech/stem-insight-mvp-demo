export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { BudgetTable } from "@/components/budget/BudgetTable";
import { getBudgetDetail } from "@/lib/queries/budget-detail";
import { prisma } from "@/lib/prisma";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [items, project] = await Promise.all([
    getBudgetDetail(projectId),
    prisma.project.findUnique({ where: { id: projectId } }),
  ]);
  if (!project) notFound();

  const categories = [...new Set(items.map((i) => i.mainCategory))].sort();

  return (
    <div>
      <PageHeader title="預算明細" subtitle={`共 ${items.length} 項`} />
      <BudgetTable items={items} categories={categories} />
    </div>
  );
}
