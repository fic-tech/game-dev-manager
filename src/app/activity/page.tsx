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
import { UserAvatar } from "@/components/user-avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { relativeTime, formatDate } from "@/lib/format";
import { format, parseISO, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";

const TYPE_LABEL: Record<string, string> = {
  issue_created: "作成",
  issue_updated: "更新",
  issue_closed: "完了",
  comment_added: "コメント",
  wiki_updated: "Wiki",
  project_created: "プロジェクト",
};

const TYPE_COLOR: Record<string, string> = {
  issue_created: "bg-sky-500/15 text-sky-300",
  issue_updated: "bg-amber-500/15 text-amber-300",
  issue_closed: "bg-emerald-500/15 text-emerald-300",
  comment_added: "bg-violet-500/15 text-violet-300",
  wiki_updated: "bg-cyan-500/15 text-cyan-300",
  project_created: "bg-rose-500/15 text-rose-300",
};

export default function ActivityPage() {
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const activities = useStore((s) => s.activities);
  const [projectId, setProjectId] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  const filtered = useMemo(() => {
    return activities
      .filter((a) => (projectId === "all" ? true : a.projectId === projectId))
      .filter((a) => (type === "all" ? true : a.type === type))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [activities, projectId, type]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof activities>();
    for (const a of filtered) {
      const key = format(startOfDay(parseISO(a.createdAt)), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">アクティビティ</h1>
          <p className="text-sm text-muted-foreground">
            プロジェクトを横断する更新履歴
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
          <Tabs value={type} onValueChange={setType}>
            <TabsList>
              <TabsTrigger value="all">すべて</TabsTrigger>
              <TabsTrigger value="issue_created">作成</TabsTrigger>
              <TabsTrigger value="issue_updated">更新</TabsTrigger>
              <TabsTrigger value="comment_added">コメント</TabsTrigger>
              <TabsTrigger value="issue_closed">完了</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-6">
          {grouped.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              アクティビティはまだありません
            </p>
          )}
          <ol className="space-y-8">
            {grouped.map(([day, list]) => (
              <li key={day}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-sm font-semibold">
                    {format(parseISO(day), "yyyy年MM月dd日 (E)", { locale: ja })}
                  </h2>
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-xs text-muted-foreground">
                    {list.length} 件
                  </span>
                </div>
                <ul className="space-y-3">
                  {list.map((a) => {
                    const actor = users.find((u) => u.id === a.actorId);
                    const project = projects.find((p) => p.id === a.projectId);
                    const href = a.issueId ? `/issues/${a.issueId}` : project ? `/projects/${project.identifier}` : "/";
                    return (
                      <li key={a.id}>
                        <Link
                          href={href}
                          className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 transition hover:border-primary/40"
                        >
                          <UserAvatar user={actor} size="sm" />
                          <div className="min-w-0">
                            <div className="text-sm">
                              <span className="font-medium">{actor?.name}</span>
                              <span className="text-muted-foreground">
                                {" が "}
                              </span>
                              {a.message}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {project?.name.split("—")[0].trim()} ·{" "}
                              {relativeTime(a.createdAt)}
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              TYPE_COLOR[a.type] ?? "bg-muted"
                            }`}
                          >
                            {TYPE_LABEL[a.type] ?? a.type}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
