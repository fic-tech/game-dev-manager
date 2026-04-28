"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StatusBadge,
  TrackerBadge,
  PriorityIndicator,
} from "@/components/issue-status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/labels";
import type { Issue, IssueStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";

const VISIBLE_STATUSES: IssueStatus[] = [
  "new",
  "in_progress",
  "feedback",
  "resolved",
  "closed",
];

export default function BoardPage() {
  const allProjects = useStore((s) => s.projects);
  const projects = allProjects.filter((p) => !p.archived);
  const issues = useStore((s) => s.issues);
  const users = useStore((s) => s.users);
  const updateIssue = useStore((s) => s.updateIssue);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "all");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<IssueStatus | null>(null);

  const filtered = useMemo(() => {
    if (projectId === "all") return issues;
    return issues.filter((i) => i.projectId === projectId);
  }, [issues, projectId]);

  const grouped = useMemo(() => {
    const map: Record<IssueStatus, Issue[]> = {
      new: [],
      in_progress: [],
      feedback: [],
      resolved: [],
      closed: [],
      rejected: [],
    };
    for (const i of filtered) map[i.status].push(i);
    for (const k of STATUS_ORDER)
      map[k].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ボード</h1>
          <p className="text-sm text-muted-foreground">
            ドラッグ&ドロップでステータスを更新できます
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">プロジェクト</span>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="h-9 min-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name.split("—")[0].trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {VISIBLE_STATUSES.map((status) => {
          const list = grouped[status];
          const isOver = overStatus === status;
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStatus(status);
              }}
              onDragLeave={() => setOverStatus(null)}
              onDrop={() => {
                if (draggingId) {
                  updateIssue(draggingId, { status });
                }
                setDraggingId(null);
                setOverStatus(null);
              }}
              className={`flex min-h-[200px] flex-col rounded-2xl border border-border/60 bg-card/30 p-3 transition ${
                isOver ? "ring-2 ring-primary/50" : ""
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <StatusBadge status={status} />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {list.length}
                </span>
              </div>
              <div className="space-y-2">
                {list.map((i) => {
                  const project = projects.find((p) => p.id === i.projectId);
                  const assignee = users.find((u) => u.id === i.assigneeId);
                  return (
                    <Card
                      key={i.id}
                      draggable
                      onDragStart={() => setDraggingId(i.id)}
                      onDragEnd={() => setDraggingId(null)}
                      className={`cursor-grab border-border/60 transition hover:border-primary/40 ${
                        draggingId === i.id ? "opacity-50" : ""
                      }`}
                    >
                      <CardContent className="p-3">
                        <Link href={`/issues/${i.id}`} className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <span
                                className="size-1.5 rounded-full"
                                style={{ background: project?.color }}
                              />
                              {project?.identifier}-{i.number}
                            </span>
                            <PriorityIndicator priority={i.priority} />
                          </div>
                          <div className="text-sm font-medium leading-snug line-clamp-3">
                            {i.subject}
                          </div>
                          <div className="flex items-center justify-between">
                            <TrackerBadge tracker={i.tracker} />
                            <div className="flex items-center gap-2">
                              {i.dueDate && (
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDate(i.dueDate, "MM/dd")}
                                </span>
                              )}
                              <UserAvatar user={assignee} size="xs" />
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
                {list.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                    {STATUS_LABEL[status]} のチケットはありません
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
