"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/user-avatar";
import {
  ASSET_CATEGORY_LABEL,
  ASSET_STATE_COLOR,
  ASSET_STATE_LABEL,
  PHASE_ACCENT,
  PHASE_DEPENDENCIES,
  PHASE_DOT,
  PHASE_LABEL,
  PHASE_ORDER,
  PHASE_STATE_COLOR,
  PHASE_STATE_LABEL,
  PRODUCTION_CATEGORY_LABEL,
  PRODUCTION_STATE_COLOR,
  PRODUCTION_STATE_LABEL,
} from "@/lib/labels";
import { formatDate, relativeTime } from "@/lib/format";
import {
  ArrowLeft,
  CalendarRange,
  Cpu,
  Film,
  Lightbulb,
  Music,
  Plus,
  Sparkles,
  Volume2,
  ImageIcon,
  Trash2,
  PencilLine,
} from "lucide-react";
import type {
  AssetState,
  Phase,
  PhaseState,
  PhaseType,
  ProductionState,
  StoryboardScene,
} from "@/lib/types";
import { toast } from "sonner";

const PHASE_ICON: Record<PhaseType, React.ComponentType<{ className?: string }>> = {
  vcon: PencilLine,
  asset: ImageIcon,
  video: Film,
  sound_compose: Music,
  sound_impl: Volume2,
  lamp: Lightbulb,
  review: Sparkles,
};

export default function ProductionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productions = useStore((s) => s.productions);
  const machines = useStore((s) => s.machines);
  const phases = useStore((s) => s.phases);
  const scenes = useStore((s) => s.scenes);
  const assetsAll = useStore((s) => s.assets);
  const soundCues = useStore((s) => s.soundCues);
  const lampCues = useStore((s) => s.lampCues);
  const users = useStore((s) => s.users);
  const updatePhase = useStore((s) => s.updatePhase);
  const updateScene = useStore((s) => s.updateScene);
  const addScene = useStore((s) => s.addScene);
  const removeScene = useStore((s) => s.removeScene);
  const updateAsset = useStore((s) => s.updateAsset);
  const updateSoundCue = useStore((s) => s.updateSoundCue);
  const updateLampCue = useStore((s) => s.updateLampCue);
  const updateProduction = useStore((s) => s.updateProduction);

  const production = productions.find((p) => p.id === params.id);

  const data = useMemo(() => {
    if (!production) return null;
    const machine = machines.find((m) => m.id === production.machineId);
    const myPhases = phases
      .filter((ph) => ph.productionId === production.id)
      .sort(
        (a, b) =>
          PHASE_ORDER.indexOf(a.type) - PHASE_ORDER.indexOf(b.type)
      );
    const myScenes = scenes
      .filter((s) => s.productionId === production.id)
      .sort((a, b) => a.order - b.order);
    const myAssets = assetsAll.filter(
      (a) => a.productionId === production.id
    );
    const mySoundCues = soundCues.filter(
      (c) => c.productionId === production.id
    );
    const myLampCues = lampCues.filter(
      (c) => c.productionId === production.id
    );
    const owner = users.find((u) => u.id === production.ownerId);
    return {
      machine,
      myPhases,
      myScenes,
      myAssets,
      mySoundCues,
      myLampCues,
      owner,
    };
  }, [production, machines, phases, scenes, assetsAll, soundCues, lampCues, users]);

  if (!production || !data) {
    if (typeof window !== "undefined") notFound();
    return null;
  }
  const { machine, myPhases, myScenes, myAssets, mySoundCues, myLampCues, owner } = data;

  const totalSec = myScenes.length > 0 ? Math.max(...myScenes.map((s) => s.endSec)) : production.durationSec;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <button
            onClick={() => router.push("/productions")}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> 演出一覧
          </button>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            <Cpu className="size-3" />
            <Link
              href={machine ? `/machines/${machine.code}` : "/machines"}
              className="hover:text-foreground"
            >
              {machine?.code}
            </Link>
            <span>· {production.code}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {production.name}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {production.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarRange className="size-3" />
              {production.targetDate
                ? formatDate(production.targetDate)
                : "期限未定"}
            </span>
            <span>·</span>
            <span>{PRODUCTION_CATEGORY_LABEL[production.category]}</span>
            <span>·</span>
            <span className="tabular-nums">{production.durationSec} 秒</span>
            <span>·</span>
            <span>更新 {relativeTime(production.updatedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={production.state}
            onValueChange={(v) =>
              updateProduction(production.id, {
                state: v as ProductionState,
              })
            }
          >
            <SelectTrigger className="h-9 min-w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRODUCTION_STATE_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <UserAvatar user={owner} size="md" />
        </div>
      </div>

      {/* パイプライン (7工程の縦バー) */}
      <PhasePipeline
        phases={myPhases}
        users={users}
        onChange={(id, patch) => updatePhase(id, patch)}
      />

      <Tabs defaultValue="storyboard">
        <TabsList>
          <TabsTrigger value="storyboard">
            Vコンテ ({myScenes.length})
          </TabsTrigger>
          <TabsTrigger value="assets">アセット ({myAssets.length})</TabsTrigger>
          <TabsTrigger value="sound">
            サウンド ({mySoundCues.length})
          </TabsTrigger>
          <TabsTrigger value="lamp">ランプ ({myLampCues.length})</TabsTrigger>
        </TabsList>

        {/* Vコンテ */}
        <TabsContent value="storyboard" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Vコンテ・タイムライン</CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  シーンごとの映像・音・ランプ指示。各シーンをクリックで詳細編集
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  addScene(production.id);
                  toast.success("シーンを追加しました");
                }}
              >
                <Plus className="size-4" /> シーン追加
              </Button>
            </CardHeader>
            <CardContent>
              <Timeline scenes={myScenes} totalSec={totalSec} />
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {myScenes.map((sc) => (
                  <SceneCard
                    key={sc.id}
                    scene={sc}
                    onChange={(patch) => updateScene(sc.id, patch)}
                    onDelete={() => {
                      removeScene(sc.id);
                      toast.success("シーンを削除しました");
                    }}
                  />
                ))}
                {myScenes.length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                    Vコンテが未作成です。最初のシーンを追加してください。
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* アセット */}
        <TabsContent value="assets" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-0">
              <ul className="divide-y divide-border/60">
                {myAssets.length === 0 && (
                  <li className="p-12 text-center text-sm text-muted-foreground">
                    関連アセットはまだ登録されていません
                  </li>
                )}
                {myAssets.map((a) => {
                  const author = users.find((u) => u.id === a.authorId);
                  return (
                    <li
                      key={a.id}
                      className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3"
                    >
                      <span
                        className="size-9 rounded-lg ring-1 ring-border/60"
                        style={{
                          background: `linear-gradient(135deg, hsl(${a.thumbHue} 70% 60%), hsl(${(a.thumbHue + 60) % 360} 70% 40%))`,
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                            {ASSET_CATEGORY_LABEL[a.category]}
                          </span>
                          <span>v{a.version}</span>
                          <span>· 更新 {relativeTime(a.updatedAt)}</span>
                        </div>
                        <div className="font-medium">{a.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {a.fileLabel}
                        </div>
                      </div>
                      <Select
                        value={a.state}
                        onValueChange={(v) =>
                          updateAsset(a.id, { state: v as AssetState })
                        }
                      >
                        <SelectTrigger className="h-8 min-w-[140px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ASSET_STATE_LABEL).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <UserAvatar user={author} size="xs" />
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* サウンドCue */}
        <TabsContent value="sound" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-0">
              <ul className="divide-y divide-border/60">
                {mySoundCues.length === 0 && (
                  <li className="p-12 text-center text-sm text-muted-foreground">
                    サウンドCueはまだ登録されていません
                  </li>
                )}
                {mySoundCues.map((c) => {
                  const assignee = users.find((u) => u.id === c.assigneeId);
                  return (
                    <li
                      key={c.id}
                      className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3"
                    >
                      <span
                        className={`grid size-9 place-items-center rounded-lg text-[10px] font-bold uppercase ${
                          c.type === "bgm"
                            ? "bg-pink-500/20 text-pink-300"
                            : c.type === "se"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-violet-500/20 text-violet-300"
                        }`}
                      >
                        {c.type}
                      </span>
                      <div>
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {c.note}
                        </div>
                      </div>
                      <Select
                        value={c.state}
                        onValueChange={(v) =>
                          updateSoundCue(c.id, { state: v as AssetState })
                        }
                      >
                        <SelectTrigger className="h-8 min-w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ASSET_STATE_LABEL).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <UserAvatar user={assignee} size="xs" />
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ランプCue */}
        <TabsContent value="lamp" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-0">
              <ul className="divide-y divide-border/60">
                {myLampCues.length === 0 && (
                  <li className="p-12 text-center text-sm text-muted-foreground">
                    ランプCueはまだ登録されていません
                  </li>
                )}
                {myLampCues.map((c) => {
                  const assignee = users.find((u) => u.id === c.assigneeId);
                  return (
                    <li
                      key={c.id}
                      className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3"
                    >
                      <div className="flex shrink-0 items-center gap-1">
                        {c.colors.map((col, i) => (
                          <span
                            key={i}
                            className="size-5 rounded-full ring-2 ring-background"
                            style={{
                              background: col,
                              boxShadow: `0 0 8px ${col}80`,
                            }}
                          />
                        ))}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {c.pattern} · {c.note}
                        </div>
                      </div>
                      <Select
                        value={c.state}
                        onValueChange={(v) =>
                          updateLampCue(c.id, { state: v as AssetState })
                        }
                      >
                        <SelectTrigger className="h-8 min-w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ASSET_STATE_LABEL).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <UserAvatar user={assignee} size="xs" />
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== パイプラインビュー =====
function PhasePipeline({
  phases,
  users,
  onChange,
}: {
  phases: Phase[];
  users: ReturnType<typeof useStore.getState>["users"];
  onChange: (id: string, patch: Partial<Phase>) => void;
}) {
  return (
    <Card className="border-border/60 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm">制作パイプライン</CardTitle>
        <p className="text-[11px] text-muted-foreground">
          各工程の状態を更新すると、後続の工程が自動でアンロックされます
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto scrollbar-thin">
          <div className="grid grid-cols-7 min-w-[1100px] gap-px bg-border/40">
            {PHASE_ORDER.map((type) => {
              const phase = phases.find((p) => p.type === type);
              if (!phase) return null;
              const Icon = PHASE_ICON[type];
              const assignee = users.find((u) => u.id === phase.assigneeId);
              const deps = PHASE_DEPENDENCIES[type];
              const blockedBy = deps.filter(
                (d) => phases.find((p) => p.type === d)?.state !== "done"
              );

              return (
                <div
                  key={type}
                  className={`relative flex flex-col gap-3 bg-card p-4 text-xs`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${PHASE_ACCENT[type]}`}
                  />
                  <div className="flex items-center gap-2">
                    <span
                      className={`grid size-8 place-items-center rounded-xl ring-1 ring-border/60 ${PHASE_DOT[type]}/20`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Phase {PHASE_ORDER.indexOf(type) + 1}
                      </div>
                      <div className="font-semibold">{PHASE_LABEL[type]}</div>
                    </div>
                  </div>

                  <div>
                    <Select
                      value={phase.state}
                      onValueChange={(v) =>
                        onChange(phase.id, { state: v as PhaseState })
                      }
                    >
                      <SelectTrigger
                        className={`h-8 text-xs ${PHASE_STATE_COLOR[phase.state]} border-0`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PHASE_STATE_LABEL).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Select
                    value={phase.assigneeId ?? "none"}
                    onValueChange={(v) =>
                      onChange(phase.id, {
                        assigneeId: v === "none" ? null : v,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未割当</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} {u.discipline ? ` · ${u.discipline}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {assignee && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <UserAvatar user={assignee} size="xs" />
                      <span className="truncate">{assignee.name}</span>
                    </div>
                  )}

                  {phase.state === "blocked" && blockedBy.length > 0 && (
                    <div className="rounded-md bg-muted/30 p-1.5 text-[10px] text-muted-foreground">
                      待機中:{" "}
                      {blockedBy.map((b) => PHASE_LABEL[b]).join(" / ")}
                    </div>
                  )}

                  {phase.estimatedHours !== undefined && (
                    <div className="mt-auto text-[10px] text-muted-foreground">
                      見積 {phase.estimatedHours}h
                      {phase.actualHours !== undefined &&
                        ` / 実績 ${phase.actualHours}h`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== タイムライン =====
function Timeline({
  scenes,
  totalSec,
}: {
  scenes: StoryboardScene[];
  totalSec: number;
}) {
  if (scenes.length === 0) return null;
  const total = Math.max(totalSec, 1);
  return (
    <div className="space-y-2">
      <div className="relative h-8 rounded-lg border border-border/60 bg-card/40">
        {scenes.map((s, idx) => {
          const left = (s.startSec / total) * 100;
          const width = ((s.endSec - s.startSec) / total) * 100;
          const hue = (idx * 70) % 360;
          return (
            <a
              key={s.id}
              href={`#scene-${s.id}`}
              className="absolute top-0 bottom-0 flex items-center overflow-hidden rounded-md ring-1 ring-border/60 transition hover:ring-primary"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: `linear-gradient(135deg, hsl(${hue} 70% 50% / 0.6), hsl(${hue} 70% 30% / 0.4))`,
              }}
            >
              <span className="px-2 truncate text-[10px] font-semibold text-foreground">
                {s.title}
              </span>
            </a>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>0s</span>
        <span>{(total / 2).toFixed(1)}s</span>
        <span>{total.toFixed(1)}s</span>
      </div>
    </div>
  );
}

// ===== シーンカード =====
function SceneCard({
  scene,
  onChange,
  onDelete,
}: {
  scene: StoryboardScene;
  onChange: (patch: Partial<StoryboardScene>) => void;
  onDelete: () => void;
}) {
  return (
    <Card
      id={`scene-${scene.id}`}
      className="border-border/60 transition hover:border-primary/30"
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="font-bold">#{scene.order}</span>
            <span className="tabular-nums">
              {scene.startSec.toFixed(1)}–{scene.endSec.toFixed(1)}s
            </span>
            <span>·</span>
            <span
              className={`rounded-full px-1.5 py-0.5 ${
                scene.state === "fixed"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-amber-500/15 text-amber-300"
              }`}
            >
              {scene.state === "fixed" ? "確定" : "ドラフト"}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
        <Input
          value={scene.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-8 text-sm font-semibold"
        />
        <Textarea
          rows={2}
          value={scene.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="シーンの概要"
          className="text-xs"
        />
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              開始 (s)
            </Label>
            <Input
              type="number"
              step="0.1"
              value={scene.startSec}
              onChange={(e) =>
                onChange({ startSec: Number(e.target.value) })
              }
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              終了 (s)
            </Label>
            <Input
              type="number"
              step="0.1"
              value={scene.endSec}
              onChange={(e) => onChange({ endSec: Number(e.target.value) })}
              className="h-8"
            />
          </div>
        </div>
        <NoteRow
          label="映像"
          icon={<Film className="size-3.5" />}
          color="text-cyan-300"
          value={scene.videoNote}
          onChange={(v) => onChange({ videoNote: v })}
        />
        <NoteRow
          label="音"
          icon={<Music className="size-3.5" />}
          color="text-pink-300"
          value={scene.soundNote}
          onChange={(v) => onChange({ soundNote: v })}
        />
        <NoteRow
          label="ランプ"
          icon={<Lightbulb className="size-3.5" />}
          color="text-yellow-200"
          value={scene.lampNote}
          onChange={(v) => onChange({ lampNote: v })}
        />
        <Select
          value={scene.state}
          onValueChange={(v) =>
            onChange({ state: v as StoryboardScene["state"] })
          }
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">ドラフト</SelectItem>
            <SelectItem value="fixed">確定</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

function NoteRow({
  label,
  icon,
  color,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${color}`}>
        {icon} {label}
      </div>
      <Textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`${label}演出の指示`}
        className="text-[11px]"
      />
    </div>
  );
}
