export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { MilestoneCard } from "@/components/schedule/MilestoneCard";
import { getSchedule } from "@/lib/queries/schedule";
import { prisma } from "@/lib/prisma";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [milestones, project] = await Promise.all([
    getSchedule(projectId),
    prisma.project.findUnique({ where: { id: projectId } }),
  ]);
  if (!project) notFound();

  return (
    <div>
      <PageHeader title="工期進度" subtitle={`${milestones.length} 個里程碑`} />
      <div className="px-4 py-4">
        {milestones.length === 0 ? (
          <div className="text-center text-gray-400 py-12 text-sm">尚無進度資料</div>
        ) : (
          milestones.map((item, i) => (
            <MilestoneCard
              key={item.id}
              item={item}
              isLast={i === milestones.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}
