"use client";

import Link from "next/link";
import { useWorkspace } from "@/components/workspace-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/user-avatar";
import { phaseProgress, PhaseDot } from "@/components/phase-chip";
import {
  PHASE_DOT,
  PHASE_LABEL,
  PHASE_ORDER,
  PRODUCTION_CATEGORY_LABEL,
  PRODUCTION_STATE_COLOR,
  PRODUCTION_STATE_LABEL,
} from "@/lib/labels";
import { formatDate, relativeTime } from "@/lib/format";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarRange,
  Clock,
  Cpu,
  PackageCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const {
    users,
    currentUserId,
    machines,
    productions,
    phases,
    assets,
    activities,
  } = useWorkspace();

  const me = users.find((u) => u.id === currentUserId);

  // 自分が担当する工程
  const myPhases = phases.filter(
    (p) =>
      p.assigneeId === currentUserId &&
      (p.state === "todo" || p.state === "in_progress" || p.state === "review")
  );

  // 自分が担当の演出 (オーナー)
  const myProductions = productions.filter(
    (p) => p.ownerId === currentUserId && p.state !== "completed"
  );

  // 全体KPI
  const activeProductions = productions.filter(
    (p) => p.state !== "completed" && p.state !== "on_hold"
  );
  const reworkAssets = assets.filter((a) => a.reworkRequired);
  const tempAssets = assets.filter((a) => a.dataKind === "temp");

  // 期限直近の演出
  const upcomingDeadlines = [...productions]
    .filter((p) => p.targetDate && p.state !== "completed")
    .sort(
      (a, b) =>
        new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime()
    )
    .slice(0, 6);

  // 直近7日の本データ提出予定
  const upcomingFinalDue = assets
    .filter((a) => a.dataKind === "temp" && a.finalDueDate)
    .map((a) => ({
      asset: a,
      due: new Date(a.finalDueDate!),
    }))
    .filter(
      ({ due }) => due.getTime() - Date.now() < 7 * 86_400_000
    )
    .sort((x, y) => x.due.getTime() - y.due.getTime())
    .slice(0, 6);

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
          {myPhases.length} 件の担当工程、{myProductions.length} 件の担当演出
          が進行中です。
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<Sparkles className="size-4" />}
          label="進行中の演出"
          value={activeProductions.length}
          hint={`全 ${productions.length} 件中`}
          accent="from-primary/30 to-primary/0"
        />
        <Stat
          icon={<Cpu className="size-4" />}
          label="開発中の機種"
          value={machines.length}
          hint="アクティブ機種"
          accent="from-chart-2/30 to-chart-2/0"
        />
        <Stat
          icon={<Clock className="size-4" />}
          label="仮データ"
          value={tempAssets.length}
          hint="本データ受領待ち"
          accent="from-amber-500/30 to-amber-500/0"
        />
        <Stat
          icon={<AlertTriangle className="size-4" />}
          label="再実装が必要"
          value={reworkAssets.length}
          hint="本データ受領後の対応"
          accent="from-rose-500/40 to-rose-500/0"
        />
      </section>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="size-4" /> 機種別の進捗
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
            const myProds = productions.filter((p) => p.machineId === m.id);
            const myPhs = phases.filter((ph) =>
              myProds.some((p) => p.id === ph.productionId)
            );
            const pct = phaseProgress(myPhs);
            const myAssets = assets.filter((a) => a.machineId === m.id);
            const finalRate =
              myAssets.length > 0
                ? Math.round(
                    (myAssets.filter((a) => a.dataKind === "final").length /
                      myAssets.length) *
                      100
                  )
                : 0;
            const reworkCount = myAssets.filter(
              (a) => a.reworkRequired
            ).length;
            return (
              <Link
                key={m.id}
                href={`/machines/${m.code}`}
                className={`rounded-xl border bg-card/40 p-4 transition hover:border-primary/40 ${
                  reworkCount > 0
                    ? "border-rose-500/30"
                    : "border-border/60"
                }`}
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
                      const list = myPhs.filter((p) => p.type === t);
                      const done = list.filter(
                        (p) => p.state === "done"
                      ).length;
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
                    {myProds.length} 演出
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <PackageCheck className="size-3" />
                  本データ {finalRate}%
                  {reworkCount > 0 && (
                    <span className="ml-auto inline-flex items-center gap-0.5 text-rose-300">
                      <AlertTriangle className="size-3" />
                      再実装 {reworkCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">期限直近の演出</CardTitle>
            <Link
              href="/productions"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              演出一覧 <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                期限が設定された演出はありません
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {upcomingDeadlines.map((p) => {
                  const machine = machines.find((m) => m.id === p.machineId);
                  const owner = users.find((u) => u.id === p.ownerId);
                  const myPhs = phases.filter(
                    (ph) => ph.productionId === p.id
                  );
                  const pct = phaseProgress(myPhs);
                  const days = Math.ceil(
                    (new Date(p.targetDate!).getTime() - Date.now()) /
                      86_400_000
                  );
                  return (
                    <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                      <Link
                        href={`/productions/${p.id}`}
                        className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ background: machine?.color }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                            {machine?.code} · {p.code}
                            <span>·</span>
                            <span>{PRODUCTION_CATEGORY_LABEL[p.category]}</span>
                          </div>
                          <div className="truncate text-sm font-medium hover:text-primary">
                            {p.name}
                          </div>
                          <Progress value={pct} className="mt-1 h-1" />
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-xs font-semibold tabular-nums ${
                              days < 0
                                ? "text-rose-400"
                                : days <= 7
                                  ? "text-amber-300"
                                  : "text-foreground"
                            }`}
                          >
                            {days < 0
                              ? `${-days}日超過`
                              : days === 0
                                ? "本日"
                                : `あと${days}日`}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatDate(p.targetDate, "MM/dd")}
                          </div>
                          <div className="mt-1 flex justify-end">
                            <UserAvatar user={owner} size="xs" />
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">マイ・タスク</CardTitle>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              担当工程
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            {myPhases.length === 0 && (
              <p className="text-sm text-muted-foreground">
                未着手の担当工程はありません 🎉
              </p>
            )}
            {myPhases.slice(0, 6).map((ph) => {
              const prod = productions.find((p) => p.id === ph.productionId);
              if (!prod) return null;
              const machine = machines.find((m) => m.id === prod.machineId);
              return (
                <Link
                  key={ph.id}
                  href={`/productions/${prod.id}`}
                  className="group block rounded-xl border border-border/60 bg-card/40 p-3 transition hover:border-primary/40 hover:bg-card"
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span
                      className={`size-1.5 rounded-full ${PHASE_DOT[ph.type]}`}
                    />
                    {PHASE_LABEL[ph.type]}
                    <span>·</span>
                    {machine?.code}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm font-medium group-hover:text-primary">
                    {prod.name}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        PRODUCTION_STATE_COLOR[prod.state]
                      }`}
                    >
                      {PRODUCTION_STATE_LABEL[prod.state]}
                    </span>
                    {prod.targetDate && (
                      <span className="text-muted-foreground inline-flex items-center gap-1">
                        <CalendarRange className="size-3" />
                        {formatDate(prod.targetDate, "MM/dd")}
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
            <CardTitle className="text-sm">本データ提出予定 (直近7日)</CardTitle>
            <Link
              href="/assets"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              素材一覧 <ArrowUpRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingFinalDue.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                直近の本データ提出予定はありません
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {upcomingFinalDue.map(({ asset, due }) => {
                  const days = Math.ceil(
                    (due.getTime() - Date.now()) / 86_400_000
                  );
                  const prod = productions.find(
                    (p) => p.id === asset.productionId
                  );
                  const machine = machines.find(
                    (m) => m.id === asset.machineId
                  );
                  return (
                    <li
                      key={asset.id}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span
                        className="size-9 rounded-lg ring-1 ring-border/60"
                        style={{
                          background: `linear-gradient(135deg, hsl(${asset.thumbHue} 70% 60%), hsl(${(asset.thumbHue + 60) % 360} 70% 40%))`,
                        }}
                      />
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {machine?.code} {prod ? `· ${prod.code}` : ""}
                        </div>
                        <div className="truncate text-sm font-medium">
                          {asset.name}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {asset.fileLabel}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-xs font-semibold tabular-nums ${
                            days < 0
                              ? "text-rose-400"
                              : days <= 2
                                ? "text-amber-300"
                                : "text-foreground"
                          }`}
                        >
                          {days < 0
                            ? `${-days}日超過`
                            : days === 0
                              ? "本日"
                              : `あと${days}日`}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {formatDate(asset.finalDueDate, "MM/dd")}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">アクティビティ</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                アクティビティはまだありません
              </p>
            ) : (
              <ul className="space-y-4">
                {activities.slice(0, 8).map((a) => {
                  const actor = users.find((u) => u.id === a.actorId);
                  const machine = machines.find((m) => m.id === a.machineId);
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
                          {machine?.code} · {relativeTime(a.createdAt)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
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
