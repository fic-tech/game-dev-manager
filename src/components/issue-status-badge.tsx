import { cn } from "@/lib/utils";
import {
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  TRACKER_COLOR,
  TRACKER_LABEL,
} from "@/lib/labels";
import type { IssuePriority, IssueStatus, IssueTracker } from "@/lib/types";

export function StatusBadge({
  status,
  className,
}: {
  status: IssueStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        STATUS_COLOR[status],
        className
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function TrackerBadge({
  tracker,
  className,
}: {
  tracker: IssueTracker;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        TRACKER_COLOR[tracker],
        className
      )}
    >
      {TRACKER_LABEL[tracker]}
    </span>
  );
}

export function PriorityIndicator({
  priority,
  showLabel = false,
  className,
}: {
  priority: IssuePriority;
  showLabel?: boolean;
  className?: string;
}) {
  const dots = priority === "low" ? 1 : priority === "normal" ? 2 : priority === "high" ? 3 : priority === "urgent" ? 4 : 5;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        PRIORITY_COLOR[priority],
        className
      )}
      title={PRIORITY_LABEL[priority]}
    >
      <span className="inline-flex items-end gap-[2px]">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn(
              "block w-[3px] rounded-sm transition",
              i <= dots ? "bg-current" : "bg-current/20"
            )}
            style={{ height: `${4 + i * 2}px` }}
          />
        ))}
      </span>
      {showLabel && <span>{PRIORITY_LABEL[priority]}</span>}
    </span>
  );
}
