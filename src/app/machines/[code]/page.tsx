"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar, UserStack } from "@/components/user-avatar";
import { PhaseDot, phaseProgress } from "@/components/phase-chip";
import {
  PHASE_DOT,
  PHASE_LABEL,
  PHASE_ORDER,
  PHASE_STATE_LABEL,
  PRODUCTION_CATEGORY_LABEL,
  PRODUCTION_STATE_COLOR,
  PRODUCTION_STATE_LABEL,
} from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { ArrowLeft, CalendarRange, Cpu } from "lucide-react";
import type { PhaseState, PhaseType } from "@/lib/types";

export default function MachineDetailPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const machines = useStore((s) => s.machines);
  const productions = useStore((s) => s.productions);
  const phases = useStore((s) => s.phases);
  const assets = useStore((s) => s.assets);
  const users = useStore((s) => s.users);

  const machine = machines.find((m) => m.code === params.code);

  const data = useMemo(() => {
    if (!machine) return null;
    const myProductions = productions
      .filter((p) => p.machineId === machine.id)
      .sort(
        (a, b) =>
          new Date(a.targetDate ?? "9999").getTime() -
          new Date(b.targetDate ?? "9999").getTime()
      );
    const myAssets = assets.filter((a) => a.machineId === machine.id);
    const members = users.filter((u) => machine.memberIds.includes(u.id));
    const overallPct = phaseProgress(
      phases.filter((ph) => myProductions.some((p) => p.id === ph.productionId))
    );
    return { myProductions, myAssets, members, overallPct };
  }, [machine, productions, phases, assets, users]);

  if (!machine || !data) {
    if (typeof window !== "undefined") notFound();
    return null;
  }
  const { myProductions, myAssets, members, overallPct } = data;

  // 工程ごとの完了カウント
  const phaseStats = PHASE_ORDER.map((t) => {
    const list = phases.filter(
      (ph) =>
        ph.type === t && myProductions.some((p) => p.id === ph.productionId)
    );
    const done = list.filter((p) => p.state === "done").length;
    const inProgress = list.filter((p) => p.state === "in_progress").length;
    const review = list.filter((p) => p.state === "review").length;
    const blocked = list.filter((p) => p.state === "blocked").length;
    return { type: t, total: list.length, done, inProgress, review, blocked };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <button
            onClick={() => router.push("/machines")}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> 機種一覧
          </button>
          <div className="flex items-center gap-3">
            <span
              className="size-12 rounded-2xl ring-2 ring-background"
              style={{
                background: `linear-gradient(135deg, ${machine.color}, ${machine.color}99)`,
              }}
            />
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                <Cpu className="size-3" /> {machine.code} · {machine.series}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {machine.name}
              </h1>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {machine.description}
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 md:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>全体進捗</span>
              <span className="font-semibold tabular-nums text-foreground">
                {overallPct}%
              </span>
            </div>
            <Progress value={overallPct} className="mt-2 h-2" />
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <Stat label="演出数" value={myProductions.length} />
              <Stat
                label="完成"
                value={myProductions.filter((p) => p.state === "completed").length}
                accent="text-emerald-400"
              />
              <Stat label="アセット" value={myAssets.length} accent="text-cyan-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-2">
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <CalendarRange className="size-3.5" /> 投入予定
            </div>
            <div className="text-sm">{machine.releaseTarget ?? "未定"}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-3">
            <div className="text-xs text-muted-foreground">
              チーム ({members.length})
            </div>
            <UserStack users={members} size="sm" max={6} />
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm">工程別ステータス</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
            {phaseStats.map((s) => {
              const pct = s.total === 0 ? 0 : Math.round((s.done / s.total) * 100);
              return (
                <div
                  key={s.type}
                  className="rounded-xl border border-border/60 bg-card/40 p-3"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                    <span className={`size-2 rounded-full ${PHASE_DOT[s.type]}`} />
                    {PHASE_LABEL[s.type]}
                  </div>
                  <div className="mt-2 text-xl font-semibold tabular-nums">
                    {s.done}/{s.total}
                  </div>
                  <Progress value={pct} className="mt-2 h-1" />
                  <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                    {s.inProgress > 0 && (
                      <span className="text-amber-400">進行 {s.inProgress}</span>
                    )}
                    {s.review > 0 && (
                      <span className="text-violet-400">確認 {s.review}</span>
                    )}
                    {s.blocked > 0 && (
                      <span>待 {s.blocked}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm">演出パイプライン</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="min-w-full text-xs">
              <thead className="border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="sticky left-0 z-10 bg-card/80 px-4 py-3 text-left font-medium backdrop-blur">
                    演出
                  </th>
                  <th className="px-2 py-3 text-left font-medium">カテゴリ</th>
                  <th className="px-2 py-3 text-left font-medium">尺</th>
                  <th className="px-2 py-3 text-left font-medium">状態</th>
                  {PHASE_ORDER.map((t) => (
                    <th
                      key={t}
                      className="px-2 py-3 text-center font-medium"
                      title={PHASE_LABEL[t]}
                    >
                      <span className="inline-flex flex-col items-center gap-1">
                        <span
                          className={`size-2 rounded-full ${PHASE_DOT[t]}`}
                        />
                        <span>{PHASE_LABEL[t]}</span>
                      </span>
                    </th>
                  ))}
                  <th className="px-2 py-3 text-left font-medium">期限</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {myProductions.map((prod) => {
                  const myPhases = phases.filter(
                    (ph) => ph.productionId === prod.id
                  );
                  const owner = users.find((u) => u.id === prod.ownerId);
                  return (
                    <tr key={prod.id} className="hover:bg-accent/20">
                      <td className="sticky left-0 z-10 bg-card/60 px-4 py-3 backdrop-blur">
                        <Link
                          href={`/productions/${prod.id}`}
                          className="block"
                        >
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {prod.code}
                          </div>
                          <div className="font-medium hover:text-primary">
                            {prod.name}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <UserAvatar user={owner} size="xs" />
                            {owner?.name}
                          </div>
                        </Link>
                      </td>
                      <td className="px-2 py-3">
                        <span className="text-[11px] text-muted-foreground">
                          {PRODUCTION_CATEGORY_LABEL[prod.category]}
                        </span>
                      </td>
                      <td className="px-2 py-3 tabular-nums text-[11px] text-muted-foreground">
                        {prod.durationSec}s
                      </td>
                      <td className="px-2 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            PRODUCTION_STATE_COLOR[prod.state]
                          }`}
                        >
                          {PRODUCTION_STATE_LABEL[prod.state]}
                        </span>
                      </td>
                      {PHASE_ORDER.map((t) => {
                        const phase = myPhases.find((p) => p.type === t);
                        return (
                          <td
                            key={t}
                            className="px-2 py-3 text-center"
                            title={
                              phase
                                ? `${PHASE_LABEL[t]}: ${PHASE_STATE_LABEL[phase.state]}`
                                : "—"
                            }
                          >
                            {phase ? (
                              <PhaseDot type={t} state={phase.state} />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2 py-3 text-[11px] text-muted-foreground">
                        {formatDate(prod.targetDate, "MM/dd")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets">アセット ({myAssets.length})</TabsTrigger>
          <TabsTrigger value="members">メンバー ({members.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="assets" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-4">
              <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {myAssets.map((a) => {
                  const author = users.find((u) => u.id === a.authorId);
                  return (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3"
                    >
                      <span
                        className="size-9 shrink-0 rounded-lg ring-1 ring-border/60"
                        style={{
                          background: `linear-gradient(135deg, hsl(${a.thumbHue} 70% 60%), hsl(${(a.thumbHue + 60) % 360} 70% 40%))`,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {a.name}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {a.fileLabel} · v{a.version}
                        </div>
                      </div>
                      <UserAvatar user={author} size="xs" />
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="members" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              {members.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3"
                >
                  <UserAvatar user={u} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {u.discipline} · {u.email}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div>
      <div className="text-muted-foreground text-[10px] uppercase tracking-wider">
        {label}
      </div>
      <div className={`text-base font-semibold tabular-nums ${accent ?? ""}`}>
        {value}
      </div>
    </div>
  );
}
