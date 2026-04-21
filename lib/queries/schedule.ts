import { prisma } from "@/lib/prisma";

export interface ScheduleMilestone {
  id: string;
  itemCode: string | null;
  milestoneName: string;
  milestoneDate: string | null;
  durationDays: number | null;
  startDate: string | null;
  endDate: string | null;
  remark: string | null;
}

export async function getSchedule(projectId: string): Promise<ScheduleMilestone[]> {
  const items = await prisma.scheduleItem.findMany({
    where: { projectId },
    orderBy: [{ milestoneDate: "asc" }, { sortOrder: "asc" }],
  });

  return items.map((item) => ({
    id: item.id,
    itemCode: item.itemCode,
    milestoneName: item.milestoneName,
    milestoneDate: item.milestoneDate ? item.milestoneDate.toISOString() : null,
    durationDays: item.durationDays,
    startDate: item.startDate ? item.startDate.toISOString() : null,
    endDate: item.endDate ? item.endDate.toISOString() : null,
    remark: item.remark,
  }));
}
