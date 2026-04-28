"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { CreateIssueDialog } from "@/components/create-issue-dialog";
import {
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  STATUS_LABEL,
  STATUS_ORDER,
  TRACKER_LABEL,
  TRACKER_ORDER,
} from "@/lib/labels";
import type { IssuePriority, IssueStatus, IssueTracker } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Plus, Search } from "lucide-react";

type SortKey = "updated" | "priority" | "due" | "number";

export default function IssuesPage() {
  const issues = useStore((s) => s.issues);
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"open" | "all" | IssueStatus>(
    "open"
  );
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [trackerFilter, setTrackerFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("updated");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = issues.slice();
    if (statusFilter === "open") {
      list = list.filter(
        (i) => i.status !== "closed" && i.status !== "rejected"
      );
    } else if (statusFilter !== "all") {
      list = list.filter((i) => i.status === statusFilter);
    }
    if (projectFilter !== "all")
      list = list.filter((i) => i.projectId === projectFilter);
    if (trackerFilter !== "all")
      list = list.filter((i) => i.tracker === trackerFilter);
    if (priorityFilter !== "all")
      list = list.filter((i) => i.priority === priorityFilter);
    if (assigneeFilter !== "all") {
      if (assigneeFilter === "me")
        list = list.filter((i) => i.assigneeId === currentUserId);
      else if (assigneeFilter === "none")
        list = list.filter((i) => !i.assigneeId);
      else list = list.filter((i) => i.assigneeId === assigneeFilter);
    }
    if (q.trim()) {
      const ql = q.toLowerCase();
      list = list.filter(
        (i) =>
          i.subject.toLowerCase().includes(ql) ||
          i.description.toLowerCase().includes(ql) ||
          i.tags.some((t) => t.toLowerCase().includes(ql))
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "priority":
          return (
            PRIORITY_ORDER.indexOf(b.priority) -
            PRIORITY_ORDER.indexOf(a.priority)
          );
        case "due":
          return (
            new Date(a.dueDate ?? "9999").getTime() -
            new Date(b.dueDate ?? "9999").getTime()
          );
        case "number":
          return b.number - a.number;
        case "updated":
        default:
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });
    return list;
  }, [
    issues,
    q,
    statusFilter,
    projectFilter,
    trackerFilter,
    priorityFilter,
    assigneeFilter,
    sortBy,
    currentUserId,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">チケット</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} 件のチケットを表示
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> 新規チケット
        </Button>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="件名・タグ・説明から検索"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <TabsList>
                <TabsTrigger value="open">オープン</TabsTrigger>
                <TabsTrigger value="all">すべて</TabsTrigger>
                <TabsTrigger value="closed">完了</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <FilterSelect
              label="プロジェクト"
              value={projectFilter}
              onChange={setProjectFilter}
              options={[
                { value: "all", label: "すべて" },
                ...projects.map((p) => ({ value: p.id, label: p.name.split("—")[0].trim() })),
              ]}
            />
            <FilterSelect
              label="種別"
              value={trackerFilter}
              onChange={setTrackerFilter}
              options={[
                { value: "all", label: "すべて" },
                ...TRACKER_ORDER.map((t) => ({
                  value: t,
                  label: TRACKER_LABEL[t],
                })),
              ]}
            />
            <FilterSelect
              label="優先度"
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                { value: "all", label: "すべて" },
                ...PRIORITY_ORDER.map((p) => ({
                  value: p,
                  label: PRIORITY_LABEL[p],
                })),
              ]}
            />
            <FilterSelect
              label="担当者"
              value={assigneeFilter}
              onChange={setAssigneeFilter}
              options={[
                { value: "all", label: "すべて" },
                { value: "me", label: "自分" },
                { value: "none", label: "未割当" },
                ...users.map((u) => ({ value: u.id, label: u.name })),
              ]}
            />
            <FilterSelect
              label="並び替え"
              value={sortBy}
              onChange={(v) => setSortBy(v as SortKey)}
              options={[
                { value: "updated", label: "更新日 (新しい順)" },
                { value: "priority", label: "優先度" },
                { value: "due", label: "期限 (近い順)" },
                { value: "number", label: "番号" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto] gap-3 border-b border-border/60 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>P</span>
            <span>種別</span>
            <span>件名</span>
            <span>ステータス</span>
            <span className="hidden md:inline">期限</span>
            <span className="hidden md:inline">プロジェクト</span>
            <span>担当</span>
          </div>
          <ul className="divide-y divide-border/60">
            {filtered.map((i) => {
              const project = projects.find((p) => p.id === i.projectId);
              const assignee = users.find((u) => u.id === i.assigneeId);
              const overdue =
                i.dueDate &&
                new Date(i.dueDate) < new Date() &&
                i.status !== "closed" &&
                i.status !== "resolved";
              return (
                <li key={i.id}>
                  <Link
                    href={`/issues/${i.id}`}
                    className="grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3 transition hover:bg-accent/30"
                  >
                    <PriorityIndicator priority={i.priority} />
                    <TrackerBadge tracker={i.tracker} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {project?.identifier}-{i.number}
                        {i.tags.length > 0 && (
                          <span className="text-muted-foreground/70">
                            · {i.tags.map((t) => `#${t}`).join(" ")}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-sm font-medium hover:text-primary">
                        {i.subject}
                      </div>
                    </div>
                    <StatusBadge status={i.status} />
                    <span
                      className={`hidden text-xs md:inline ${
                        overdue ? "text-rose-400" : "text-muted-foreground"
                      }`}
                    >
                      {i.dueDate ? formatDate(i.dueDate, "MM/dd") : "—"}
                    </span>
                    <span className="hidden truncate text-xs text-muted-foreground md:inline max-w-[120px]">
                      {project?.name.split("—")[0].trim()}
                    </span>
                    <UserAvatar user={assignee} size="xs" />
                  </Link>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="p-12 text-center text-sm text-muted-foreground">
                チケットが見つかりません
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      <CreateIssueDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 min-w-[120px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
