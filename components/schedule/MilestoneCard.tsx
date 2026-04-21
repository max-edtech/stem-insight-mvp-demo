import { formatDate } from "@/lib/formatters";
import type { ScheduleMilestone } from "@/lib/queries/schedule";

export function MilestoneCard({ item, isLast }: { item: ScheduleMilestone; isLast: boolean }) {
  return (
    <div className="flex gap-3">
      {/* timeline spine */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-indigo-600 shrink-0 mt-0.5 ring-2 ring-indigo-100" />
        {!isLast && <div className="w-px flex-1 bg-gray-200 mt-1" />}
      </div>

      {/* content */}
      <div className={`pb-5 flex-1 ${isLast ? "" : ""}`}>
        {item.milestoneDate && (
          <div className="text-xs text-indigo-500 font-semibold mb-0.5">
            {formatDate(item.milestoneDate)}
          </div>
        )}
        <div className="text-sm font-semibold text-gray-900">{item.milestoneName}</div>
        <div className="flex gap-3 mt-1 flex-wrap">
          {item.durationDays && (
            <span className="text-xs text-gray-400">{item.durationDays} 天</span>
          )}
          {item.itemCode && (
            <span className="text-xs text-gray-300">{item.itemCode}</span>
          )}
          {item.remark && (
            <span className="text-xs text-gray-400 italic">{item.remark}</span>
          )}
        </div>
      </div>
    </div>
  );
}
