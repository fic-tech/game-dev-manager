"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrackerBadge, StatusBadge } from "@/components/issue-status-badge";
import {
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
} from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarPage() {
  const projects = useStore((s) => s.projects);
  const issues = useStore((s) => s.issues);
  const [cursor, setCursor] = useState(new Date());
  const [projectId, setProjectId] = useState<string>("all");

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const filtered = useMemo(
    () =>
      issues.filter((i) =>
        projectId === "all" ? true : i.projectId === projectId
      ),
    [issues, projectId]
  );

  const byDate = useMemo(() => {
    const map = new Map<string, typeof issues>();
    for (const i of filtered) {
      if (!i.dueDate) continue;
      const key = format(parseISO(i.dueDate), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(i);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">カレンダー</h1>
          <p className="text-sm text-muted-foreground">
            期限のあるチケットを月単位で確認します
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(addMonths(cursor, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="min-w-[140px] text-center text-sm font-semibold">
            {format(cursor, "yyyy年 MM月", { locale: ja })}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(addMonths(cursor, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" onClick={() => setCursor(new Date())}>
            今日
          </Button>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="h-9 min-w-[180px]">
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

      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-border/60 bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground">
            {["月", "火", "水", "木", "金", "土", "日"].map((wd) => (
              <div key={wd} className="px-3 py-2 text-center">
                {wd}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const key = format(day, "yyyy-MM-dd");
              const list = byDate.get(key) ?? [];
              const inMonth = isSameMonth(day, cursor);
              const isToday = isSameDay(day, new Date());
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              return (
                <div
                  key={idx}
                  className={`min-h-[120px] border-b border-r border-border/40 p-2 text-xs ${
                    isWeekend ? "bg-muted/10" : ""
                  } ${!inMonth ? "opacity-40" : ""}`}
                >
                  <div
                    className={`mb-1 flex size-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {list.slice(0, 3).map((i) => {
                      const project = projects.find(
                        (p) => p.id === i.projectId
                      );
                      return (
                        <Link
                          key={i.id}
                          href={`/issues/${i.id}`}
                          className="block truncate rounded-md px-1.5 py-0.5 text-[10px] transition hover:bg-accent"
                          style={{
                            background: `${project?.color}22`,
                            borderLeft: `3px solid ${project?.color}`,
                          }}
                          title={i.subject}
                        >
                          {i.subject}
                        </Link>
                      );
                    })}
                    {list.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{list.length - 3} 件
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-5">
          <h2 className="mb-3 text-sm font-semibold">今月の期限一覧</h2>
          <ul className="divide-y divide-border/60">
            {filtered
              .filter(
                (i) =>
                  i.dueDate &&
                  isSameMonth(parseISO(i.dueDate), cursor) &&
                  i.status !== "closed"
              )
              .sort(
                (a, b) =>
                  new Date(a.dueDate!).getTime() -
                  new Date(b.dueDate!).getTime()
              )
              .map((i) => {
                const project = projects.find((p) => p.id === i.projectId);
                return (
                  <li key={i.id}>
                    <Link
                      href={`/issues/${i.id}`}
                      className="flex items-center gap-3 py-2 text-sm hover:bg-accent/30"
                    >
                      <span className="w-12 text-xs tabular-nums text-muted-foreground">
                        {format(parseISO(i.dueDate!), "MM/dd")}
                      </span>
                      <TrackerBadge tracker={i.tracker} />
                      <span className="flex-1 truncate">{i.subject}</span>
                      <span className="text-xs text-muted-foreground">
                        {project?.identifier}-{i.number}
                      </span>
                      <StatusBadge status={i.status} />
                    </Link>
                  </li>
                );
              })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
