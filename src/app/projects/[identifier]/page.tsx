"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StatusBadge,
  TrackerBadge,
  PriorityIndicator,
} from "@/components/issue-status-badge";
import { UserAvatar, UserStack } from "@/components/user-avatar";
import { CreateIssueDialog } from "@/components/create-issue-dialog";
import { formatDate, relativeTime } from "@/lib/format";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/labels";
import {
  ArrowLeft,
  CalendarRange,
  CircleCheck,
  Plus,
  Users as UsersIcon,
} from "lucide-react";
import type { IssueStatus } from "@/lib/types";

export default function ProjectDetailPage() {
  const params = useParams<{ identifier: string }>();
  const router = useRouter();
  const allProjects = useStore((s) => s.projects);
  const allIssues = useStore((s) => s.issues);
  const allWikiPages = useStore((s) => s.wikiPages);
  const users = useStore((s) => s.users);
  const project = allProjects.find((p) => p.identifier === params.identifier);
  const issues = allIssues.filter((i) => i.projectId === project?.id);
  const wikiPages = allWikiPages.filter((w) => w.projectId === project?.id);
  const [createOpen, setCreateOpen] = useState(false);

  if (!project) {
    if (typeof window !== "undefined") notFound();
    return null;
  }
  const members = users.filter((u) => project.memberIds.includes(u.id));
  const completed = issues.filter(
    (i) => i.status === "closed" || i.status === "resolved"
  ).length;
  const pct =
    issues.length === 0 ? 0 : Math.round((completed / issues.length) * 100);

  const byStatus: Record<IssueStatus, typeof issues> = {
    new: [],
    in_progress: [],
    feedback: [],
    resolved: [],
    closed: [],
    rejected: [],
  };
  for (const i of issues) byStatus[i.status].push(i);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <button
            onClick={() => router.push("/projects")}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> プロジェクト一覧
          </button>
          <div className="flex items-center gap-3">
            <span
              className="size-12 rounded-2xl ring-2 ring-background"
              style={{
                background: `linear-gradient(135deg, ${project.color}, ${project.color}99)`,
              }}
            />
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {project.identifier}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {project.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/projects/${project.identifier}/wiki/home`}>
            <Button variant="outline">Wiki を開く</Button>
          </Link>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> チケット
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 md:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>進捗</span>
              <span className="font-semibold tabular-nums text-foreground">
                {pct}%
              </span>
            </div>
            <Progress value={pct} className="mt-2 h-2" />
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground">合計</div>
                <div className="text-base font-semibold tabular-nums">
                  {issues.length}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">完了</div>
                <div className="text-base font-semibold tabular-nums text-emerald-400">
                  {completed}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">進行中</div>
                <div className="text-base font-semibold tabular-nums text-amber-400">
                  {byStatus.in_progress.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-2">
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <CalendarRange className="size-3.5" />
              スケジュール
            </div>
            <div className="text-sm">
              {formatDate(project.startDate)} → {formatDate(project.endDate)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-3">
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <UsersIcon className="size-3.5" />
              メンバー ({members.length})
            </div>
            <UserStack users={members} size="sm" />
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="issues">チケット</TabsTrigger>
          <TabsTrigger value="wiki">Wiki</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="border-border/60 lg:col-span-2">
            <CardHeader>
              <CardTitle>ステータス別の内訳</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {STATUS_ORDER.map((status) => {
                const list = byStatus[status];
                const ratio =
                  issues.length === 0
                    ? 0
                    : Math.round((list.length / issues.length) * 100);
                return (
                  <div key={status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={status} />
                        <span className="text-muted-foreground">
                          {list.length}件
                        </span>
                      </div>
                      <span className="tabular-nums text-muted-foreground">
                        {ratio}%
                      </span>
                    </div>
                    <Progress value={ratio} className="h-1" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>メンバーごとの担当</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map((m) => {
                const mine = issues.filter((i) => i.assigneeId === m.id);
                const done = mine.filter(
                  (i) => i.status === "closed" || i.status === "resolved"
                ).length;
                const ratio =
                  mine.length === 0 ? 0 : Math.round((done / mine.length) * 100);
                return (
                  <div key={m.id} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <UserAvatar user={m} size="xs" />
                      <span className="truncate">{m.name}</span>
                      <span className="ml-auto tabular-nums text-muted-foreground">
                        {done}/{mine.length}
                      </span>
                    </div>
                    <Progress value={ratio} className="h-1" />
                  </div>
                );
              })}
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  メンバーが登録されていません
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="mt-6">
          <Card className="border-border/60">
            <CardContent className="p-0">
              <ul className="divide-y divide-border/60">
                {issues.length === 0 && (
                  <li className="p-8 text-center text-sm text-muted-foreground">
                    チケットがありません
                  </li>
                )}
                {issues
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.updatedAt).getTime() -
                      new Date(a.updatedAt).getTime()
                  )
                  .map((i) => {
                    const assignee = users.find((u) => u.id === i.assigneeId);
                    return (
                      <li key={i.id}>
                        <Link
                          href={`/issues/${i.id}`}
                          className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] items-center gap-3 px-4 py-3 transition hover:bg-accent/30"
                        >
                          <PriorityIndicator priority={i.priority} />
                          <TrackerBadge tracker={i.tracker} />
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {project.identifier}-{i.number}
                            </div>
                            <div className="truncate text-sm font-medium hover:text-primary">
                              {i.subject}
                            </div>
                          </div>
                          <StatusBadge status={i.status} />
                          <span className="hidden text-xs text-muted-foreground md:inline">
                            {i.dueDate ? formatDate(i.dueDate, "MM/dd") : "—"}
                          </span>
                          <UserAvatar user={assignee} size="xs" />
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wiki" className="mt-6 space-y-3">
          {wikiPages.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Wiki ページはありません。
                <Link
                  href={`/projects/${project.identifier}/wiki/home`}
                  className="ml-2 text-primary hover:underline"
                >
                  最初のページを作成
                </Link>
              </CardContent>
            </Card>
          ) : (
            wikiPages.map((w) => (
              <Link
                key={w.id}
                href={`/projects/${project.identifier}/wiki/${w.slug}`}
                className="block rounded-xl border border-border/60 bg-card/40 p-4 transition hover:border-primary/40 hover:bg-card"
              >
                <div className="flex items-center gap-2">
                  <CircleCheck className="size-4 text-primary" />
                  <span className="font-semibold">{w.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    更新 {relativeTime(w.updatedAt)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {w.body.replace(/[#*`>]/g, "").slice(0, 140)}
                </p>
              </Link>
            ))
          )}
        </TabsContent>
      </Tabs>

      <CreateIssueDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultProjectId={project.id}
      />
    </div>
  );
}
