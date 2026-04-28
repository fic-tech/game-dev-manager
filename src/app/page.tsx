"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, TrackerBadge, PriorityIndicator } from "@/components/issue-status-badge";
import { UserAvatar, UserStack } from "@/components/user-avatar";
import { formatDate, relativeTime } from "@/lib/format";
import {
  ArrowUpRight,
  CalendarRange,
  CircleCheck,
  CircleDot,
  Inbox,
  TrendingUp,
  Cpu,
  Sparkles,
} from "lucide-react";
import type { Issue, Project, User } from "@/lib/types";
import { phaseProgress, PhaseDot } from "@/components/phase-chip";
import { PHASE_DOT, PHASE_LABEL, PHASE_ORDER } from "@/lib/labels";

export default function DashboardPage() {
  const allProjects = useStore((s) => s.projects);
  const projects = allProjects.filter((p) => !p.archived);
  const issues = useStore((s) => s.issues);
  const users = useStore((s) => s.users);
  const activities = useStore((s) => s.activities);
  const currentUserId = useStore((s) => s.currentUserId);
  const machines = useStore((s) => s.machines);
  const productions = useStore((s) => s.productions);
  const phases = useStore((s) => s.phases);

  const me = users.find((u) => u.id === currentUserId);
  const myIssues = issues.filter(
    (i) =>
      i.assigneeId === currentUserId &&
      i.status !== "closed" &&
      i.status !== "rejected"
  );
  const openIssues = issues.filter(
    (i) => i.status !== "closed" && i.status !== "rejected"
  );
  const closedThisWeek = issues.filter(
    (i) =>
      (i.status === "closed" || i.status === "resolved") &&
      Date.now() - new Date(i.updatedAt).getTime() < 7 * 86_400_000
  );
  const overdue = openIssues.filter(
    (i) => i.dueDate && new Date(i.dueDate) < new Date()
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {formatDate(new Date().toISOString(), "yyyy年MM月dd日")}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          おかえりなさい、{me?.name.split(" ")[0] ?? "ゲスト"}さん。
        </h1>
        <p className="text-sm text-muted-foreground">
          {myIssues.length} 件の自分の作業、{openIssues.length} 件のオープンチケット、
          {overdue.length} 件の期限超過があります。
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<Inbox className="size-4" />}
          label="自分の担当"
          value={myIssues.length}
          hint="未完了"
          accent="from-primary/30 to-primary/0"
        />
        <Stat
          icon={<CircleDot className="size-4" />}
          label="オープン"
          value={openIssues.length}
          hint={`全 ${issues.length} 件中`}
          accent="from-chart-2/30 to-chart-2/0"
        />
        <Stat
          icon={<CircleCheck className="size-4" />}
          label="今週完了"
          value={closedThisWeek.length}
          hint="解決 / 完了"
          accent="from-chart-3/30 to-chart-3/0"
        />
        <Stat
          icon={<CalendarRange className="size-4" />}
          label="期限超過"
          value={overdue.length}
          hint="要フォロー"
          accent="from-chart-5/40 to-chart-5/0"
        />
      </section>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="size-4" /> 遊技機開発の進捗
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              機種ごとの演出制作と各工程のサマリー
            </p>
          </div>
          <Link
            href="/machines"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            機種一覧 <ArrowUpRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {machines.map((m) => {
            const myProductions = productions.filter(
              (p) => p.machineId === m.id
            );
            const myPhases = phases.filter((ph) =>
              myProductions.some((p) => p.id === ph.productionId)
            );
            const pct = phaseProgress(myPhases);
            return (
              <Link
                key={m.id}
                href={`/machines/${m.code}`}
                className="rounded-xl border border-border/60 bg-card/40 p-4 transition hover:border-primary/40"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-6 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${m.color}, ${m.color}99)`,
                    }}
                  />
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {m.code}
                    </div>
                    <div className="text-sm font-semibold leading-tight">
                      {m.name.split("〜")[0]}
                    </div>
                  </div>
                  <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
                    {pct}%
                  </span>
                </div>
                <Progress value={pct} className="mt-3 h-1" />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {PHASE_ORDER.map((t) => {
                      const list = myPhases.filter((p) => p.type === t);
                      const done = list.filter((p) => p.state === "done").length;
                      const inProgress = list.filter(
                        (p) => p.state === "in_progress"
                      ).length;
                      const state =
                        done === list.length && list.length > 0
                          ? "done"
                          : inProgress > 0
                            ? "in_progress"
                            : list.some((p) => p.state === "review")
                              ? "review"
                              : list.some((p) => p.state === "todo")
                                ? "todo"
                                : "blocked";
                      return (
                        <PhaseDot key={t} type={t} state={state} size={9} />
                      );
                    })}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {myProductions.length} 演出
                  </span>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>進行中のプロジェクト</CardTitle>
            <Link
              href="/projects"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              すべて表示 <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.map((p) => (
              <ProjectProgressRow
                key={p.id}
                project={p}
                issues={issues}
                users={users}
              />
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>マイチケット</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myIssues.length === 0 && (
              <p className="text-sm text-muted-foreground">
                未完了のタスクはありません 🎉
              </p>
            )}
            {myIssues.slice(0, 6).map((i) => {
              const project = projects.find((p) => p.id === i.projectId);
              return (
                <Link
                  key={i.id}
                  href={`/issues/${i.id}`}
                  className="group block rounded-xl border border-border/60 bg-card/40 p-3 transition hover:border-primary/40 hover:bg-card"
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: project?.color }}
                    />
                    {project?.identifier}-{i.number}
                    <PriorityIndicator priority={i.priority} className="ml-auto" />
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm font-medium group-hover:text-primary">
                    {i.subject}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <StatusBadge status={i.status} />
                    {i.dueDate && (
                      <span className="text-muted-foreground">
                        〆 {formatDate(i.dueDate, "MM/dd")}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>最近のチケット</CardTitle>
            <Link
              href="/issues"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              すべてのチケット <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border/60">
              {[...issues]
                .sort(
                  (a, b) =>
                    new Date(b.updatedAt).getTime() -
                    new Date(a.updatedAt).getTime()
                )
                .slice(0, 8)
                .map((i) => {
                  const project = projects.find((p) => p.id === i.projectId);
                  const assignee = users.find((u) => u.id === i.assigneeId);
                  return (
                    <li key={i.id} className="py-3 first:pt-0 last:pb-0">
                      <Link
                        href={`/issues/${i.id}`}
                        className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
                      >
                        <TrackerBadge tracker={i.tracker} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                            {project?.identifier}-{i.number}
                            <span>·</span>
                            <span>{relativeTime(i.updatedAt)}</span>
                          </div>
                          <div className="truncate text-sm font-medium hover:text-primary">
                            {i.subject}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={i.status} />
                          <UserAvatar user={assignee} size="xs" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>アクティビティ</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {activities.slice(0, 8).map((a) => {
                const actor = users.find((u) => u.id === a.actorId);
                const project = projects.find((p) => p.id === a.projectId);
                return (
                  <li key={a.id} className="flex gap-3">
                    <UserAvatar user={actor} size="xs" />
                    <div className="text-xs">
                      <p className="text-foreground">
                        <span className="font-medium">{actor?.name}</span>
                        <span className="text-muted-foreground"> が </span>
                        {a.message}
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        {project?.name.split("—")[0].trim()} ·{" "}
                        {relativeTime(a.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  accent: string;
}) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br backdrop-blur">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`}
      />
      <CardContent className="relative p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="grid place-items-center size-7 rounded-lg bg-background/60 ring-1 ring-border/60">
            {icon}
          </span>
          <span>{label}</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums">{value}</span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectProgressRow({
  project,
  issues,
  users,
}: {
  project: Project;
  issues: Issue[];
  users: User[];
}) {
  const projectIssues = issues.filter((i) => i.projectId === project.id);
  const total = projectIssues.length;
  const completed = projectIssues.filter(
    (i) => i.status === "closed" || i.status === "resolved"
  ).length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const members = users.filter((u) => project.memberIds.includes(u.id));

  return (
    <Link
      href={`/projects/${project.identifier}`}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-border/60 bg-card/30 p-4 transition hover:border-primary/40 hover:bg-card"
    >
      <span
        className="size-10 rounded-xl ring-2 ring-background"
        style={{
          background: `linear-gradient(135deg, ${project.color} 0%, ${project.color}88 100%)`,
        }}
      />
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold group-hover:text-primary">
            {project.name}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {project.identifier}
          </span>
        </div>
        <Progress value={pct} className="h-1.5" />
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>
            {completed} / {total} 完了
          </span>
          {project.endDate && (
            <span>· 期限 {formatDate(project.endDate, "MM/dd")}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <UserStack users={members} size="xs" />
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {pct}%
        </span>
      </div>
    </Link>
  );
}
