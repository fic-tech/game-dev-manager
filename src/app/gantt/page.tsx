"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrackerBadge, StatusBadge } from "@/components/issue-status-badge";
import { addDays, differenceInDays, format, startOfWeek } from "date-fns";
import { ja } from "date-fns/locale";

type Range = "30" | "60" | "90";

export default function GanttPage() {
  const allProjects = useStore((s) => s.projects);
  const projects = allProjects.filter((p) => !p.archived);
  const issues = useStore((s) => s.issues);
  const users = useStore((s) => s.users);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "all");
  const [range, setRange] = useState<Range>("60");

  const days = Number(range);
  const start = useMemo(
    () => startOfWeek(addDays(new Date(), -7), { weekStartsOn: 1 }),
    []
  );
  const end = useMemo(() => addDays(start, days), [start, days]);

  const list = useMemo(() => {
    return issues
      .filter((i) => (projectId === "all" ? true : i.projectId === projectId))
      .filter((i) => i.startDate || i.dueDate)
      .sort((a, b) => {
        const sa = new Date(a.startDate ?? a.createdAt).getTime();
        const sb = new Date(b.startDate ?? b.createdAt).getTime();
        return sa - sb;
      });
  }, [issues, projectId]);

  const dayList = useMemo(
    () => Array.from({ length: days }, (_, i) => addDays(start, i)),
    [start, days]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ガント</h1>
          <p className="text-sm text-muted-foreground">
            期間が設定されたチケットを時系列で可視化します
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="h-9 min-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのプロジェクト</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name.split("—")[0].trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
            <TabsList>
              <TabsTrigger value="30">30日</TabsTrigger>
              <TabsTrigger value="60">60日</TabsTrigger>
              <TabsTrigger value="90">90日</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <div className="min-w-[1100px]">
              {/* ヘッダ行: 月のラベル */}
              <div
                className="sticky top-0 z-10 grid border-b border-border/60 bg-card/60 backdrop-blur"
                style={{
                  gridTemplateColumns: `260px repeat(${days}, minmax(20px, 1fr))`,
                }}
              >
                <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  チケット
                </div>
                {dayList.map((d, idx) => {
                  const isFirst = idx === 0 || d.getDate() === 1;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday =
                    format(d, "yyyy-MM-dd") ===
                    format(new Date(), "yyyy-MM-dd");
                  return (
                    <div
                      key={idx}
                      className={`relative border-l border-border/40 py-2 text-center text-[9px] ${
                        isWeekend ? "bg-muted/20" : ""
                      } ${isToday ? "bg-primary/10" : ""}`}
                    >
                      {isFirst && (
                        <div className="absolute -top-1 left-0 right-0 px-1 text-[9px] font-semibold text-foreground">
                          {format(d, "M月", { locale: ja })}
                        </div>
                      )}
                      <span className="text-muted-foreground">{d.getDate()}</span>
                    </div>
                  );
                })}
              </div>

              {/* ボディ行 */}
              <div>
                {list.length === 0 && (
                  <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                    期間が設定されたチケットがありません
                  </div>
                )}
                {list.map((i) => {
                  const project = projects.find((p) => p.id === i.projectId);
                  const assignee = users.find((u) => u.id === i.assigneeId);
                  const s = new Date(i.startDate ?? i.dueDate ?? i.createdAt);
                  const e = new Date(i.dueDate ?? i.startDate ?? i.createdAt);
                  const offset = Math.max(differenceInDays(s, start), 0);
                  let span = Math.max(differenceInDays(e, s) + 1, 1);
                  if (offset >= days) return null;
                  if (offset + span > days) span = days - offset;
                  return (
                    <div
                      key={i.id}
                      className="grid border-b border-border/40 hover:bg-accent/20"
                      style={{
                        gridTemplateColumns: `260px repeat(${days}, minmax(20px, 1fr))`,
                      }}
                    >
                      <Link
                        href={`/issues/${i.id}`}
                        className="flex flex-col gap-0.5 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          <span
                            className="size-1.5 rounded-full"
                            style={{ background: project?.color }}
                          />
                          {project?.identifier}-{i.number}
                        </div>
                        <div className="truncate text-sm hover:text-primary">
                          {i.subject}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          {assignee?.name ?? "未割当"} ·{" "}
                          <StatusBadge status={i.status} className="!px-1 !py-0" />
                        </div>
                      </Link>
                      {dayList.map((_, idx) => (
                        <div
                          key={idx}
                          className={`relative border-l border-border/40 ${
                            dayList[idx].getDay() === 0 ||
                            dayList[idx].getDay() === 6
                              ? "bg-muted/10"
                              : ""
                          }`}
                        >
                          {idx === offset && (
                            <Link
                              href={`/issues/${i.id}`}
                              className="absolute inset-y-2 z-10 flex items-center"
                              style={{
                                left: `2px`,
                                width: `calc(${span * 100}% - 4px)`,
                              }}
                            >
                              <div
                                className="relative h-7 w-full overflow-hidden rounded-md ring-1 ring-border/60 transition hover:ring-primary"
                                style={{
                                  background: `linear-gradient(90deg, ${
                                    project?.color
                                  }55 0%, ${project?.color}33 100%)`,
                                }}
                              >
                                <div
                                  className="absolute inset-y-0 left-0"
                                  style={{
                                    width: `${i.doneRatio}%`,
                                    background: `linear-gradient(90deg, ${
                                      project?.color
                                    } 0%, ${project?.color}cc 100%)`,
                                  }}
                                />
                                <div className="relative flex h-full items-center gap-1 px-2 text-[10px] font-medium text-foreground">
                                  <TrackerBadge tracker={i.tracker} className="!px-1 !py-0" />
                                  <span className="truncate">{i.subject}</span>
                                  <span className="ml-auto tabular-nums text-foreground/80">
                                    {i.doneRatio}%
                                  </span>
                                </div>
                              </div>
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
