export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { AcceptanceHubClient } from "@/components/acceptance/AcceptanceHubClient";
import { getAcceptanceReadiness } from "@/lib/queries/acceptance";

export default async function AcceptancePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const readiness = await getAcceptanceReadiness(projectId);

  if (!readiness) notFound();

  return (
    <div>
      <PageHeader
        title="對外驗收中心"
        subtitle={`${readiness.project.name} · 自動 ${readiness.autoDecision.toUpperCase()} (${readiness.passCount}/${readiness.totalChecks})`}
      />
      <AcceptanceHubClient projectId={projectId} readiness={readiness} />
    </div>
  );
}
