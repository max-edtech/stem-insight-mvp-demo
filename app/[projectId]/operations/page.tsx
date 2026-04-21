export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { OperationsHubClient } from "@/components/operations/OperationsHubClient";
import { getOperationsOverview } from "@/lib/queries/operations";
import { formatAmount } from "@/lib/formatters";

export default async function OperationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const data = await getOperationsOverview(projectId);

  if (!data.project) notFound();

  const label = data.project
    ? `目前獲利 ${formatAmount(data.summary.currentProfit)} / 稅後 ${formatAmount(data.summary.latestAfterTaxProfit)}`
    : "尚未建立完整案件資料";

  return (
    <div>
      <PageHeader title="作業中心" subtitle={label} />
      <OperationsHubClient projectId={projectId} data={data} />
    </div>
  );
}
