"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserStack } from "@/components/user-avatar";
import { CreateProjectDialog } from "./create-project-dialog";
import { Plus, Search, ArrowUpRight, CalendarRange } from "lucide-react";
import { formatDate } from "@/lib/format";

export default function ProjectsPage() {
  const projects = useStore((s) => s.projects);
  const issues = useStore((s) => s.issues);
  const users = useStore((s) => s.users);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"active" | "archived" | "all">("active");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    return projects
      .filter((p) =>
        filter === "all"
          ? true
          : filter === "archived"
            ? p.archived
            : !p.archived
      )
      .filter((p) =>
        q.trim() === ""
          ? true
          : (p.name + p.identifier + p.description)
              .toLowerCase()
              .includes(q.toLowerCase())
      );
  }, [projects, q, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">プロジェクト</h1>
          <p className="text-sm text-muted-foreground">
            進行中・アーカイブ済みのプロジェクトを一覧で管理します。
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          新規プロジェクト
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="プロジェクトを検索"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="active">進行中</TabsTrigger>
            <TabsTrigger value="archived">アーカイブ</TabsTrigger>
            <TabsTrigger value="all">すべて</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const projectIssues = issues.filter((i) => i.projectId === p.id);
          const completed = projectIssues.filter(
            (i) => i.status === "closed" || i.status === "resolved"
          ).length;
          const pct =
            projectIssues.length === 0
              ? 0
              : Math.round((completed / projectIssues.length) * 100);
          const members = users.filter((u) => p.memberIds.includes(u.id));
          return (
            <Link key={p.id} href={`/projects/${p.identifier}`}>
              <Card className="group relative h-full overflow-hidden border-border/60 transition hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
                <div
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ background: p.color }}
                />
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {p.identifier}
                      </div>
                      <h3 className="text-base font-semibold leading-snug text-balance group-hover:text-primary">
                        {p.name}
                      </h3>
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" />
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>進捗</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {pct}%
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <UserStack users={members} size="xs" />
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>
                        {projectIssues.length} 件のチケット
                      </span>
                      {p.endDate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarRange className="size-3" />
                          {formatDate(p.endDate, "MM/dd")}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-16 text-center text-sm text-muted-foreground">
            該当するプロジェクトはありません
          </p>
        )}
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
