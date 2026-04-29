"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/user-avatar";
import {
  ASSET_CATEGORY_LABEL,
  ASSET_STATE_COLOR,
  ASSET_STATE_LABEL,
  DATA_KIND_COLOR,
  DATA_KIND_LABEL,
  DATA_KIND_SHORT,
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
  REVISION_IMPACT_COLOR,
  REVISION_IMPACT_HINT,
  REVISION_IMPACT_LABEL,
  REVISION_IMPACT_SHORT,
  VIDEO_TASK_STATE_COLOR,
  VIDEO_TASK_STATE_LABEL,
} from "@/lib/labels";
import { formatDate, relativeTime } from "@/lib/format";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarRange,
  CheckCircle2,
  Clock,
  Cpu,
  Film,
  GripVertical,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Music,
  Plus,
  Sparkles,
  Volume2,
  ImageIcon,
  Trash2,
  PencilLine,
  PackageCheck,
} from "lucide-react";
import type {
  Asset,
  AssetCategory,
  AssetState,
  LampCue,
  Phase,
  PhaseState,
  PhaseType,
  ProductionState,
  RevisionImpact,
  SoundCue,
  StoryboardScene,
  VideoTask,
  VideoTaskState,
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
  const videoTasksAll = useStore((s) => s.videoTasks);
  const users = useStore((s) => s.users);
  const updatePhase = useStore((s) => s.updatePhase);
  const updateScene = useStore((s) => s.updateScene);
  const addScene = useStore((s) => s.addScene);
  const removeScene = useStore((s) => s.removeScene);
  const updateAsset = useStore((s) => s.updateAsset);
  const addAsset = useStore((s) => s.addAsset);
  const removeAsset = useStore((s) => s.removeAsset);
  const markAssetFinal = useStore((s) => s.markAssetFinal);
  const markAssetReworkDone = useStore((s) => s.markAssetReworkDone);
  const updateSoundCue = useStore((s) => s.updateSoundCue);
  const addSoundCue = useStore((s) => s.addSoundCue);
  const removeSoundCue = useStore((s) => s.removeSoundCue);
  const updateLampCue = useStore((s) => s.updateLampCue);
  const addLampCue = useStore((s) => s.addLampCue);
  const removeLampCue = useStore((s) => s.removeLampCue);
  const updateProduction = useStore((s) => s.updateProduction);
  const addVideoTask = useStore((s) => s.addVideoTask);
  const updateVideoTask = useStore((s) => s.updateVideoTask);
  const removeVideoTask = useStore((s) => s.removeVideoTask);

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
    const myVideoTasks = videoTasksAll
      .filter((t) => t.productionId === production.id)
      .sort((a, b) => a.order - b.order);
    const owner = users.find((u) => u.id === production.ownerId);
    return {
      machine,
      myPhases,
      myScenes,
      myAssets,
      mySoundCues,
      myLampCues,
      myVideoTasks,
      owner,
    };
  }, [production, machines, phases, scenes, assetsAll, soundCues, lampCues, videoTasksAll, users]);

  if (!production || !data) {
    if (typeof window !== "undefined") notFound();
    return null;
  }
  const {
    machine,
    myPhases,
    myScenes,
    myAssets,
    mySoundCues,
    myLampCues,
    myVideoTasks,
    owner,
  } = data;

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
          <EditableTitle
            value={production.name}
            onChange={(name) => {
              const trimmed = name.trim();
              if (!trimmed || trimmed === production.name) return;
              updateProduction(production.id, { name: trimmed });
              toast.success("演出名を更新しました");
            }}
          />
          <EditableDescription
            value={production.description}
            onChange={(description) => {
              if (description === production.description) return;
              updateProduction(production.id, { description });
            }}
          />
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

      {/* 素材ステータスサマリ (仮/本データ・影響度) */}
      <AssetDataSummary assets={myAssets} />

      {/* パイプライン (7工程の縦バー) */}
      <PhasePipeline
        phases={myPhases}
        users={users}
        videoTasks={myVideoTasks}
        onChange={(id, patch) => updatePhase(id, patch)}
      />

      {/* 映像実装の要件定義タスク */}
      <VideoRequirementsCard
        production={production}
        tasks={myVideoTasks}
        users={users}
        onAdd={() => {
          addVideoTask(production.id);
          toast.success("タスクを追加しました");
        }}
        onUpdate={(id, patch) => updateVideoTask(id, patch)}
        onRemove={(id) => {
          removeVideoTask(id);
          toast.success("タスクを削除しました");
        }}
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
          <AssetTabPane
            assets={myAssets}
            users={users}
            onAdd={() => {
              const created = addAsset(production.id);
              if (created) toast.success("アセットを追加しました");
            }}
            onUpdate={(id, patch) => updateAsset(id, patch)}
            onRemove={(id) => {
              removeAsset(id);
              toast.success("アセットを削除しました");
            }}
            onChangeImpact={(id, impact) =>
              updateAsset(id, { revisionImpact: impact })
            }
            onMarkFinal={(id, impact, note) =>
              markAssetFinal(id, impact, note)
            }
            onMarkReworkDone={(id) => markAssetReworkDone(id)}
          />
        </TabsContent>

        {/* サウンドCue */}
        <TabsContent value="sound" className="mt-4">
          <SoundTabPane
            cues={mySoundCues}
            users={users}
            onAdd={() => {
              addSoundCue(production.id);
              toast.success("サウンドCueを追加しました");
            }}
            onUpdate={(id, patch) => updateSoundCue(id, patch)}
            onRemove={(id) => {
              removeSoundCue(id);
              toast.success("サウンドCueを削除しました");
            }}
          />
        </TabsContent>

        {/* ランプCue */}
        <TabsContent value="lamp" className="mt-4">
          <LampTabPane
            cues={myLampCues}
            users={users}
            onAdd={() => {
              addLampCue(production.id);
              toast.success("ランプCueを追加しました");
            }}
            onUpdate={(id, patch) => updateLampCue(id, patch)}
            onRemove={(id) => {
              removeLampCue(id);
              toast.success("ランプCueを削除しました");
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== パイプラインビュー =====
function PhasePipeline({
  phases,
  users,
  videoTasks,
  onChange,
}: {
  phases: Phase[];
  users: ReturnType<typeof useStore.getState>["users"];
  videoTasks: VideoTask[];
  onChange: (id: string, patch: Partial<Phase>) => void;
}) {
  return (
    <Card className="border-border/60 overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-sm">制作パイプライン</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            各工程の状態を更新すると、後続の工程が自動でアンロックされます
          </p>
        </div>
        <WorkflowGuideButton />
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

                  <PhaseHoursBlock
                    phase={phase}
                    videoTasks={videoTasks}
                    onChange={onChange}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== 予実工数ブロック (Phase 内) =====
function PhaseHoursBlock({
  phase,
  videoTasks,
  onChange,
}: {
  phase: Phase;
  videoTasks: VideoTask[];
  onChange: (id: string, patch: Partial<Phase>) => void;
}) {
  const [open, setOpen] = useState(false);
  const tracked = phase.trackHours !== false; // undefined は true 扱い

  if (!tracked) {
    return (
      <div className="mt-auto flex items-center justify-between gap-2 rounded-md border border-dashed border-border/40 px-2 py-1.5 text-[10px] text-muted-foreground">
        <span>予実管理 対象外</span>
        <button
          type="button"
          className="rounded text-[10px] underline-offset-2 hover:underline"
          onClick={() => onChange(phase.id, { trackHours: true })}
        >
          有効化
        </button>
      </div>
    );
  }

  // video 工程は要件定義タスクの合計から自動算出 (source of truth = VideoTask)
  if (phase.type === "video") {
    const tasks = videoTasks.filter((t) => t.productionId === phase.productionId);
    const est = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
    const act = tasks.reduce((s, t) => s + (t.actualHours ?? 0), 0);
    const hasActual = tasks.some((t) => t.actualHours !== undefined);
    return (
      <div className="mt-auto space-y-1">
        <a
          href="#video-requirements"
          className="block w-full rounded-md border border-cyan-500/30 bg-cyan-500/[0.07] px-2 py-1 text-left text-[10px] text-cyan-100/90 transition hover:bg-cyan-500/[0.12]"
          title="要件定義タスクから自動集計。クリックでタスク一覧へ"
        >
          <div className="flex items-center justify-between">
            <span>
              見積 {est}h{hasActual && ` / 実績 ${act}h`}
            </span>
            <ListChecks className="size-3 opacity-70" />
          </div>
          <div className="mt-0.5 text-[9px] opacity-70">
            タスク {tasks.length}件から集計
          </div>
        </a>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[9px] text-muted-foreground/70 underline-offset-2 hover:text-foreground hover:underline"
        >
          予実管理を対象外にする
        </button>
        <VideoPhaseHoursDialog
          phase={phase}
          totalEstimate={est}
          totalActual={act}
          taskCount={tasks.length}
          open={open}
          onOpenChange={setOpen}
          onSave={(patch) => {
            onChange(phase.id, patch);
            setOpen(false);
            toast.success("予実管理設定を更新しました");
          }}
        />
      </div>
    );
  }

  return (
    <div className="mt-auto space-y-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-border/40 bg-muted/20 px-2 py-1 text-left text-[10px] text-muted-foreground transition hover:border-border hover:bg-muted/40"
      >
        <div className="flex items-center justify-between">
          <span>
            見積 {phase.estimatedHours ?? "—"}h
            {phase.actualHours !== undefined && ` / 実績 ${phase.actualHours}h`}
          </span>
          <PencilLine className="size-3 opacity-60" />
        </div>
      </button>
      <PhaseHoursDialog
        phase={phase}
        open={open}
        onOpenChange={setOpen}
        onSave={(patch) => {
          onChange(phase.id, patch);
          setOpen(false);
          toast.success("予実工数を更新しました");
        }}
      />
    </div>
  );
}

// 映像実装用：VideoTask 合計を表示し、編集できるのは trackHours のみ
function VideoPhaseHoursDialog({
  phase,
  totalEstimate,
  totalActual,
  taskCount,
  open,
  onOpenChange,
  onSave,
}: {
  phase: Phase;
  totalEstimate: number;
  totalActual: number;
  taskCount: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (patch: Partial<Phase>) => void;
}) {
  const [tracked, setTracked] = useState<boolean>(phase.trackHours !== false);
  useEffect(() => {
    if (open) setTracked(phase.trackHours !== false);
  }, [open, phase]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>映像実装の予実工数</DialogTitle>
          <DialogDescription>
            映像実装の予実工数は <strong>「映像実装 要件定義」のタスク</strong>
            {" "}から自動集計されます。タスクを編集すると、ここの数値も同期されます。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/[0.06] p-3">
            <div className="text-[11px] uppercase tracking-wider text-cyan-200/80">
              タスク {taskCount}件 の集計
            </div>
            <div className="mt-1 flex items-baseline gap-3 text-sm">
              <div>
                見積{" "}
                <span className="text-lg font-semibold tabular-nums text-foreground">
                  {totalEstimate}
                </span>
                <span className="text-xs text-muted-foreground">h</span>
              </div>
              <div>
                実績{" "}
                <span className="text-lg font-semibold tabular-nums text-foreground">
                  {totalActual}
                </span>
                <span className="text-xs text-muted-foreground">h</span>
              </div>
            </div>
            <a
              href="#video-requirements"
              onClick={() => onOpenChange(false)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:underline"
            >
              <ListChecks className="size-3.5" />
              要件定義タスクを編集する
            </a>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={tracked}
              onCheckedChange={(v) => setTracked(v === true)}
            />
            <span>予実管理を行う</span>
          </label>
          {!tracked && (
            <p className="text-[11px] text-muted-foreground">
              対象外にすると、要件定義タスクからの集計値は表示されません。
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            キャンセル
          </Button>
          <Button size="sm" onClick={() => onSave({ trackHours: tracked })}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhaseHoursDialog({
  phase,
  open,
  onOpenChange,
  onSave,
}: {
  phase: Phase;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (patch: Partial<Phase>) => void;
}) {
  const [estimated, setEstimated] = useState<string>(
    phase.estimatedHours !== undefined ? String(phase.estimatedHours) : ""
  );
  const [actual, setActual] = useState<string>(
    phase.actualHours !== undefined ? String(phase.actualHours) : ""
  );
  const [tracked, setTracked] = useState<boolean>(phase.trackHours !== false);
  const [note, setNote] = useState<string>(phase.note ?? "");

  // open のたびに最新値で初期化
  useEffect(() => {
    if (open) {
      setEstimated(
        phase.estimatedHours !== undefined ? String(phase.estimatedHours) : ""
      );
      setActual(
        phase.actualHours !== undefined ? String(phase.actualHours) : ""
      );
      setTracked(phase.trackHours !== false);
      setNote(phase.note ?? "");
    }
  }, [open, phase]);

  const submit = () => {
    if (!tracked) {
      onSave({
        trackHours: false,
        estimatedHours: undefined,
        actualHours: undefined,
        note,
      });
      return;
    }
    const e = estimated.trim() === "" ? undefined : Number(estimated);
    const a = actual.trim() === "" ? undefined : Number(actual);
    if (e !== undefined && (Number.isNaN(e) || e < 0)) {
      toast.error("見積工数の値が不正です");
      return;
    }
    if (a !== undefined && (Number.isNaN(a) || a < 0)) {
      toast.error("実績工数の値が不正です");
      return;
    }
    onSave({
      trackHours: true,
      estimatedHours: e,
      actualHours: a,
      note,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{PHASE_LABEL[phase.type]} の予実工数</DialogTitle>
          <DialogDescription>
            この工程の見積/実績工数を編集します。外注や自社対応外の場合は
            「予実管理を行う」をオフにしてください。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={tracked}
              onCheckedChange={(v) => setTracked(v === true)}
            />
            <span>予実管理を行う</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">見積工数 (h)</Label>
              <Input
                type="number"
                min={0}
                step="0.5"
                value={estimated}
                disabled={!tracked}
                onChange={(e) => setEstimated(e.target.value)}
                placeholder="例: 8"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">実績工数 (h)</Label>
              <Input
                type="number"
                min={0}
                step="0.5"
                value={actual}
                disabled={!tracked}
                onChange={(e) => setActual(e.target.value)}
                placeholder="未入力可"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">メモ (任意)</Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="工程に関するメモ"
              className="text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            キャンセル
          </Button>
          <Button size="sm" onClick={submit}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

// ===== 素材ステータスサマリ =====
function AssetDataSummary({ assets }: { assets: Asset[] }) {
  if (assets.length === 0) return null;
  const total = assets.length;
  const tempCount = assets.filter((a) => a.dataKind === "temp").length;
  const finalCount = assets.filter((a) => a.dataKind === "final").length;
  const reworkOpen = assets.filter((a) => a.reworkRequired).length;
  const reworkSwap = assets.filter(
    (a) => a.dataKind === "temp" && a.revisionImpact === "swap"
  ).length;
  const reworkExpected = assets.filter(
    (a) => a.dataKind === "temp" && a.revisionImpact === "rework"
  ).length;
  const unknownImpact = assets.filter(
    (a) => a.dataKind === "temp" && a.revisionImpact === "unknown"
  ).length;
  const finalRate = Math.round((finalCount / total) * 100);

  // 本データ提出予定が直近7日のもの
  const today = new Date();
  const upcoming = assets
    .filter((a) => a.dataKind === "temp" && a.finalDueDate)
    .map((a) => ({ a, due: new Date(a.finalDueDate!) }))
    .filter(({ due }) => {
      const diff = due.getTime() - today.getTime();
      return diff < 7 * 24 * 60 * 60 * 1000; // 7日以内 (過ぎてるものも含める)
    })
    .sort((x, y) => x.due.getTime() - y.due.getTime());

  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              <PackageCheck className="size-3.5" />
              素材ステータス
              <WorkflowGuideButton variant="inline" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">
                {finalCount}
                <span className="text-sm text-muted-foreground"> / {total}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                本データ受領 ({finalRate}%)
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Stat
              tone="amber"
              icon={<Clock className="size-3" />}
              label="仮データ"
              value={tempCount}
              hint={`差し替え予定${reworkSwap} / 再実装${reworkExpected} / 判定前${unknownImpact}`}
            />
            <Stat
              tone="rose"
              icon={<AlertTriangle className="size-3" />}
              label="要再実装"
              value={reworkOpen}
              hint="本データ受領後、構成変更ありで未対応のもの"
            />
            <Stat
              tone="sky"
              icon={<CheckCircle2 className="size-3" />}
              label="本データ"
              value={finalCount}
              hint="受領済み (再実装中含む)"
            />
          </div>
        </div>
        <Progress value={finalRate} className="h-1.5" />
        {upcoming.length > 0 && (
          <div className="rounded-lg bg-muted/30 p-2.5 text-[11px]">
            <div className="mb-1 inline-flex items-center gap-1 font-semibold text-amber-300">
              <Clock className="size-3" /> 本データ提出予定 (直近7日)
            </div>
            <ul className="space-y-0.5">
              {upcoming.slice(0, 5).map(({ a, due }) => {
                const daysLeft = Math.ceil(
                  (due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
                );
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <span
                      className={`tabular-nums font-semibold ${daysLeft < 0 ? "text-rose-400" : daysLeft <= 2 ? "text-amber-300" : "text-foreground"}`}
                    >
                      {daysLeft < 0
                        ? `${-daysLeft}日超過`
                        : daysLeft === 0
                          ? "本日"
                          : `あと${daysLeft}日`}
                    </span>
                    <span>·</span>
                    <span className="truncate">{a.name}</span>
                    <span className="ml-auto text-[10px]">
                      {formatDate(a.finalDueDate, "MM/dd")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  tone,
  icon,
  label,
  value,
  hint,
}: {
  tone: "amber" | "rose" | "sky";
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
}) {
  const toneClass = {
    amber: "bg-amber-500/10 text-amber-200 ring-amber-500/30",
    rose: "bg-rose-500/10 text-rose-200 ring-rose-500/30",
    sky: "bg-sky-500/10 text-sky-200 ring-sky-500/30",
  }[tone];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`flex min-w-[110px] items-center gap-2 rounded-lg px-3 py-1.5 ring-1 ${toneClass}`}
        >
          <span className="opacity-80">{icon}</span>
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-wider opacity-80">
              {label}
            </div>
            <div className="text-base font-semibold tabular-nums">{value}</div>
          </div>
        </div>
      </TooltipTrigger>
      {hint && <TooltipContent>{hint}</TooltipContent>}
    </Tooltip>
  );
}

// ===== アセット行 =====
function AssetRow({
  asset,
  author,
  users,
  onUpdate,
  onRemove,
  onChangeState,
  onChangeImpact,
  onMarkFinal,
  onMarkReworkDone,
}: {
  asset: Asset;
  author: ReturnType<typeof useStore.getState>["users"][number] | undefined;
  users: ReturnType<typeof useStore.getState>["users"];
  onUpdate: (patch: Partial<Asset>) => void;
  onRemove: () => void;
  onChangeState: (state: AssetState) => void;
  onChangeImpact: (impact: RevisionImpact) => void;
  onMarkFinal: (impact: RevisionImpact, note?: string) => void;
  onMarkReworkDone: () => void;
}) {
  const [finalDialogOpen, setFinalDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const dueInfo = (() => {
    if (!asset.finalDueDate || asset.dataKind === "final") return null;
    const due = new Date(asset.finalDueDate);
    const days = Math.ceil(
      (due.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );
    if (days < 0) return { text: `提出 ${-days}日超過`, tone: "text-rose-400" };
    if (days === 0) return { text: "提出 本日", tone: "text-amber-300" };
    if (days <= 3) return { text: `提出まで${days}日`, tone: "text-amber-300" };
    return { text: `提出まで${days}日`, tone: "text-muted-foreground" };
  })();

  const isRework = asset.reworkRequired === true;

  return (
    <li
      className={`grid grid-cols-[auto_1fr_auto] items-start gap-3 px-4 py-3 ${
        isRework ? "bg-rose-500/[0.04]" : ""
      }`}
    >
      <span
        className="size-9 rounded-lg ring-1 ring-border/60"
        style={{
          background: `linear-gradient(135deg, hsl(${asset.thumbHue} 70% 60%), hsl(${(asset.thumbHue + 60) % 360} 70% 40%))`,
        }}
      />
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {editing ? (
            <Select
              value={asset.category}
              onValueChange={(v) =>
                onUpdate({ category: v as AssetCategory })
              }
            >
              <SelectTrigger className="h-6 min-w-[120px] text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASSET_CATEGORY_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
              {ASSET_CATEGORY_LABEL[asset.category]}
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${DATA_KIND_COLOR[asset.dataKind]}`}
          >
            {DATA_KIND_LABEL[asset.dataKind]}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  // unknown -> swap -> rework -> unknown のサイクル切替
                  const next: RevisionImpact =
                    asset.revisionImpact === "unknown"
                      ? "swap"
                      : asset.revisionImpact === "swap"
                        ? "rework"
                        : "unknown";
                  onChangeImpact(next);
                  toast(
                    `影響度を「${REVISION_IMPACT_LABEL[next]}」に変更しました`
                  );
                }}
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition hover:brightness-125 ${REVISION_IMPACT_COLOR[asset.revisionImpact]}`}
              >
                {REVISION_IMPACT_SHORT[asset.revisionImpact]}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs font-semibold">
                {REVISION_IMPACT_LABEL[asset.revisionImpact]}
              </div>
              <div className="text-[10px] opacity-80">
                {REVISION_IMPACT_HINT[asset.revisionImpact]}
              </div>
              <div className="mt-1 text-[10px] opacity-70">
                クリックで切り替え
              </div>
            </TooltipContent>
          </Tooltip>
          <span>v{asset.version}</span>
          {dueInfo && (
            <span className={`inline-flex items-center gap-1 ${dueInfo.tone}`}>
              <Clock className="size-3" />
              {dueInfo.text}
            </span>
          )}
          {asset.dataKind === "final" && asset.finalReceivedAt && (
            <span className="text-emerald-300/80">
              本データ {relativeTime(asset.finalReceivedAt)} 受領
            </span>
          )}
          <span>· 更新 {relativeTime(asset.updatedAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <Input
              value={asset.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="h-7 text-sm font-medium"
            />
          ) : (
            <span className="font-medium">{asset.name}</span>
          )}
          {isRework && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-300 ring-1 ring-rose-500/40">
              <AlertTriangle className="size-3" />
              再実装が必要
            </span>
          )}
        </div>
        {editing ? (
          <Input
            value={asset.fileLabel}
            onChange={(e) => onUpdate({ fileLabel: e.target.value })}
            placeholder="ファイル名 / 識別子"
            className="h-7 text-[11px]"
          />
        ) : (
          <div className="truncate text-[11px] text-muted-foreground">
            {asset.fileLabel || (
              <span className="italic opacity-60">ファイル名未設定</span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {asset.dataKind === "temp" ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setFinalDialogOpen(true)}
          >
            <PackageCheck className="size-3.5" />
            本データ受領
          </Button>
        ) : isRework ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-rose-500/40 text-xs text-rose-200 hover:bg-rose-500/10"
            onClick={() => {
              onMarkReworkDone();
              toast.success("再実装完了として記録しました");
            }}
          >
            <CheckCircle2 className="size-3.5" />
            再実装完了
          </Button>
        ) : null}
        <Select
          value={asset.state}
          onValueChange={(v) => onChangeState(v as AssetState)}
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
        {editing ? (
          <Select
            value={asset.authorId}
            onValueChange={(v) => onUpdate({ authorId: v })}
          >
            <SelectTrigger className="h-8 min-w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <UserAvatar user={author} size="xs" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setEditing((v) => !v)}
          title={editing ? "編集を完了" : "編集"}
        >
          {editing ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <PencilLine className="size-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onRemove}
          title="削除"
        >
          <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>

      <FinalDataDialog
        asset={asset}
        open={finalDialogOpen}
        onOpenChange={setFinalDialogOpen}
        onSubmit={(impact, note) => {
          onMarkFinal(impact, note);
          setFinalDialogOpen(false);
          toast.success(
            impact === "rework"
              ? "本データ受領 — 再実装が必要としてマークしました"
              : "本データ受領を記録しました"
          );
        }}
      />
    </li>
  );
}

// ===== 本データ受領ダイアログ =====
function FinalDataDialog({
  asset,
  open,
  onOpenChange,
  onSubmit,
}: {
  asset: Asset;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (impact: RevisionImpact, note?: string) => void;
}) {
  const [impact, setImpact] = useState<RevisionImpact>(
    asset.revisionImpact === "unknown" ? "swap" : asset.revisionImpact
  );
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>本データを受領</DialogTitle>
          <DialogDescription>
            「{asset.name}」を本データとして登録します。仮データ実装と比較した
            ソフト側の影響度を選んでください。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {(["swap", "rework", "unknown"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setImpact(opt)}
              className={`w-full rounded-lg border p-3 text-left transition ${
                impact === opt
                  ? "border-primary bg-primary/5"
                  : "border-border/60 hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${REVISION_IMPACT_COLOR[opt]}`}
                >
                  {REVISION_IMPACT_LABEL[opt]}
                </span>
                {impact === opt && (
                  <CheckCircle2 className="size-4 text-primary" />
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {REVISION_IMPACT_HINT[opt]}
              </p>
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">変更点メモ (任意)</Label>
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例: タイミングが2秒短縮、構図変更あり"
            className="text-xs"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            キャンセル
          </Button>
          <Button size="sm" onClick={() => onSubmit(impact, note.trim() || undefined)}>
            <PackageCheck className="size-4" />
            受領を記録
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== 演出名 / 説明のインライン編集 =====
function EditableTitle({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          onChange(draft);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onChange(draft);
            setEditing(false);
          } else if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="h-10 text-2xl font-semibold tracking-tight"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group flex items-center gap-2 rounded-md text-left text-2xl font-semibold tracking-tight text-balance hover:bg-muted/30"
    >
      <span>{value}</span>
      <PencilLine className="size-4 opacity-0 transition group-hover:opacity-60" />
    </button>
  );
}

function EditableDescription({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  if (editing) {
    return (
      <Textarea
        autoFocus
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          onChange(draft);
          setEditing(false);
        }}
        className="max-w-2xl text-sm"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="block max-w-2xl rounded-md text-left text-sm text-muted-foreground hover:bg-muted/30"
    >
      {value || (
        <span className="italic opacity-60">説明を追加…</span>
      )}
    </button>
  );
}

// ===== アセットタブ =====
function AssetTabPane({
  assets,
  users,
  onAdd,
  onUpdate,
  onRemove,
  onChangeImpact,
  onMarkFinal,
  onMarkReworkDone,
}: {
  assets: Asset[];
  users: ReturnType<typeof useStore.getState>["users"];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Asset>) => void;
  onRemove: (id: string) => void;
  onChangeImpact: (id: string, impact: RevisionImpact) => void;
  onMarkFinal: (id: string, impact: RevisionImpact, note?: string) => void;
  onMarkReworkDone: (id: string) => void;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm">アセット一覧</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            この演出に紐づく素材。名前/種別/担当などはクリックで編集できます
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="size-4" /> アセット追加
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border/60">
          {assets.length === 0 && (
            <li className="p-12 text-center text-sm text-muted-foreground">
              関連アセットはまだ登録されていません
            </li>
          )}
          {assets.map((a) => {
            const author = users.find((u) => u.id === a.authorId);
            return (
              <AssetRow
                key={a.id}
                asset={a}
                author={author}
                users={users}
                onUpdate={(patch) => onUpdate(a.id, patch)}
                onRemove={() => onRemove(a.id)}
                onChangeState={(state) => onUpdate(a.id, { state })}
                onChangeImpact={(impact) => onChangeImpact(a.id, impact)}
                onMarkFinal={(impact, note) => onMarkFinal(a.id, impact, note)}
                onMarkReworkDone={() => onMarkReworkDone(a.id)}
              />
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

// ===== サウンドCue タブ =====
function SoundTabPane({
  cues,
  users,
  onAdd,
  onUpdate,
  onRemove,
}: {
  cues: SoundCue[];
  users: ReturnType<typeof useStore.getState>["users"];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<SoundCue>) => void;
  onRemove: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm">サウンドCue</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            BGM/SE/ボイスのキュー一覧。鉛筆アイコンから編集できます
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="size-4" /> Cue追加
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border/60">
          {cues.length === 0 && (
            <li className="p-12 text-center text-sm text-muted-foreground">
              サウンドCueはまだ登録されていません
            </li>
          )}
          {cues.map((c) => {
            const assignee = users.find((u) => u.id === c.assigneeId);
            const isEditing = editingId === c.id;
            return (
              <li
                key={c.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3"
              >
                <Select
                  value={c.type}
                  onValueChange={(v) =>
                    onUpdate(c.id, { type: v as SoundCue["type"] })
                  }
                >
                  <SelectTrigger
                    className={`size-9 px-0 [&>svg]:hidden grid place-items-center rounded-lg text-[10px] font-bold uppercase ${
                      c.type === "bgm"
                        ? "bg-pink-500/20 text-pink-300"
                        : c.type === "se"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-violet-500/20 text-violet-300"
                    }`}
                  >
                    <span>{c.type}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bgm">BGM</SelectItem>
                    <SelectItem value="se">SE</SelectItem>
                    <SelectItem value="voice">ボイス</SelectItem>
                  </SelectContent>
                </Select>
                {isEditing ? (
                  <div className="space-y-1.5">
                    <Input
                      value={c.name}
                      onChange={(e) =>
                        onUpdate(c.id, { name: e.target.value })
                      }
                      className="h-8 text-sm font-medium"
                    />
                    <Textarea
                      rows={1}
                      value={c.note}
                      onChange={(e) =>
                        onUpdate(c.id, { note: e.target.value })
                      }
                      placeholder="メモ"
                      className="text-[11px]"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {c.note || (
                        <span className="italic opacity-60">メモなし</span>
                      )}
                    </div>
                  </div>
                )}
                <Select
                  value={c.state}
                  onValueChange={(v) =>
                    onUpdate(c.id, { state: v as AssetState })
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
                <Select
                  value={c.assigneeId ?? "none"}
                  onValueChange={(v) =>
                    onUpdate(c.id, { assigneeId: v === "none" ? null : v })
                  }
                >
                  <SelectTrigger className="h-8 min-w-[120px] text-xs">
                    <SelectValue
                      placeholder={assignee ? assignee.name : "未割当"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未割当</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setEditingId(isEditing ? null : c.id)}
                  title={isEditing ? "完了" : "編集"}
                >
                  {isEditing ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <PencilLine className="size-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => onRemove(c.id)}
                  title="削除"
                >
                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

// ===== ランプCue タブ =====
function LampTabPane({
  cues,
  users,
  onAdd,
  onUpdate,
  onRemove,
}: {
  cues: LampCue[];
  users: ReturnType<typeof useStore.getState>["users"];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<LampCue>) => void;
  onRemove: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm">ランプCue</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            ランプ演出のCue一覧。色はカンマ区切りのHEXで編集できます
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="size-4" /> Cue追加
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border/60">
          {cues.length === 0 && (
            <li className="p-12 text-center text-sm text-muted-foreground">
              ランプCueはまだ登録されていません
            </li>
          )}
          {cues.map((c) => {
            const assignee = users.find((u) => u.id === c.assigneeId);
            const isEditing = editingId === c.id;
            return (
              <li
                key={c.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3"
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
                {isEditing ? (
                  <div className="space-y-1.5">
                    <Input
                      value={c.name}
                      onChange={(e) =>
                        onUpdate(c.id, { name: e.target.value })
                      }
                      className="h-8 text-sm font-medium"
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <Input
                        value={c.pattern}
                        onChange={(e) =>
                          onUpdate(c.id, { pattern: e.target.value })
                        }
                        placeholder="パターン (fade等)"
                        className="h-7 text-[11px]"
                      />
                      <Input
                        value={c.colors.join(",")}
                        onChange={(e) =>
                          onUpdate(c.id, {
                            colors: e.target.value
                              .split(",")
                              .map((v) => v.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="#fff, #f00"
                        className="h-7 text-[11px]"
                      />
                    </div>
                    <Textarea
                      rows={1}
                      value={c.note}
                      onChange={(e) =>
                        onUpdate(c.id, { note: e.target.value })
                      }
                      placeholder="メモ"
                      className="text-[11px]"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {c.pattern} {c.note ? `· ${c.note}` : ""}
                    </div>
                  </div>
                )}
                <Select
                  value={c.state}
                  onValueChange={(v) =>
                    onUpdate(c.id, { state: v as AssetState })
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
                <Select
                  value={c.assigneeId ?? "none"}
                  onValueChange={(v) =>
                    onUpdate(c.id, { assigneeId: v === "none" ? null : v })
                  }
                >
                  <SelectTrigger className="h-8 min-w-[120px] text-xs">
                    <SelectValue
                      placeholder={assignee ? assignee.name : "未割当"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未割当</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setEditingId(isEditing ? null : c.id)}
                  title={isEditing ? "完了" : "編集"}
                >
                  {isEditing ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <PencilLine className="size-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => onRemove(c.id)}
                  title="削除"
                >
                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

// ===== 映像実装 要件定義タスク =====
function VideoRequirementsCard({
  production,
  tasks,
  users,
  onAdd,
  onUpdate,
  onRemove,
}: {
  production: { id: string };
  tasks: VideoTask[];
  users: ReturnType<typeof useStore.getState>["users"];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<VideoTask>) => void;
  onRemove: (id: string) => void;
}) {
  void production;
  const totalEstimate = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
  const totalActual = tasks.reduce((s, t) => s + (t.actualHours ?? 0), 0);
  const doneCount = tasks.filter((t) => t.state === "done").length;
  const doneEstimate = tasks
    .filter((t) => t.state === "done")
    .reduce((s, t) => s + (t.estimatedHours || 0), 0);
  const progress =
    totalEstimate > 0 ? Math.round((doneEstimate / totalEstimate) * 100) : 0;

  return (
    <Card id="video-requirements" className="border-border/60 scroll-mt-24">
      <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ListChecks className="size-4 text-cyan-300" />
            <CardTitle className="text-sm">映像実装 要件定義</CardTitle>
          </div>
          <p className="text-[11px] text-muted-foreground">
            映像実装に必要なタスクを洗い出して工数見積もりを行います。
            ここの見積/実績は制作パイプラインの「映像実装」と同期します
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span>
            タスク {doneCount}/{tasks.length}
          </span>
          <span>·</span>
          <span>
            見積合計{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {totalEstimate}h
            </span>
          </span>
          {totalActual > 0 && (
            <>
              <span>·</span>
              <span>
                実績合計{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {totalActual}h
                </span>
              </span>
            </>
          )}
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus className="size-4" /> タスク追加
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length > 0 && <Progress value={progress} className="h-1.5" />}
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
            まだタスクがありません。「タスク追加」から要件を洗い出しましょう。
          </div>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <VideoTaskRow
                key={t.id}
                task={t}
                users={users}
                onUpdate={(patch) => onUpdate(t.id, patch)}
                onRemove={() => onRemove(t.id)}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function VideoTaskRow({
  task,
  users,
  onUpdate,
  onRemove,
}: {
  task: VideoTask;
  users: ReturnType<typeof useStore.getState>["users"];
  onUpdate: (patch: Partial<VideoTask>) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const assignee = users.find((u) => u.id === task.assigneeId);
  return (
    <li className="rounded-lg border border-border/60 bg-card/60 p-3">
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-2">
        <GripVertical className="size-3.5 text-muted-foreground/50" />
        <Input
          value={task.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="h-8 text-sm font-medium"
        />
        <Input
          type="number"
          min={0}
          step="0.5"
          value={task.estimatedHours}
          onChange={(e) =>
            onUpdate({ estimatedHours: Number(e.target.value) || 0 })
          }
          className="h-8 w-[90px] text-xs tabular-nums"
          title="見積 (h)"
        />
        <Input
          type="number"
          min={0}
          step="0.5"
          value={task.actualHours ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onUpdate({
              actualHours: v === "" ? undefined : Number(v) || 0,
            });
          }}
          placeholder="実績"
          className="h-8 w-[90px] text-xs tabular-nums"
          title="実績 (h)"
        />
        <Select
          value={task.state}
          onValueChange={(v) =>
            onUpdate({ state: v as VideoTaskState })
          }
        >
          <SelectTrigger
            className={`h-8 min-w-[110px] text-xs ${VIDEO_TASK_STATE_COLOR[task.state]} border-0`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(VIDEO_TASK_STATE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={task.assigneeId ?? "none"}
          onValueChange={(v) =>
            onUpdate({ assigneeId: v === "none" ? null : v })
          }
        >
          <SelectTrigger className="h-8 min-w-[120px] text-xs">
            <SelectValue
              placeholder={assignee ? assignee.name : "未割当"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">未割当</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setOpen((v) => !v)}
            title="詳細"
          >
            <PencilLine className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onRemove}
            title="削除"
          >
            <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>
      {open && (
        <div className="mt-2 space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            詳細・備考
          </Label>
          <Textarea
            rows={2}
            value={task.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="このタスクで何を作るか、考慮事項など"
            className="text-xs"
          />
        </div>
      )}
    </li>
  );
}

// ===== ワークフロー説明 =====
function WorkflowGuideButton({
  variant = "card",
}: {
  variant?: "card" | "inline";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {variant === "card" ? (
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-[11px]"
          onClick={() => setOpen(true)}
        >
          <HelpCircle className="size-3.5" />
          ワークフロー
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-0.5 rounded-full px-1 text-[10px] normal-case tracking-normal text-muted-foreground/80 hover:text-foreground"
          title="状態遷移ガイドを開く"
        >
          <HelpCircle className="size-3" />
          ガイド
        </button>
      )}
      <WorkflowGuideDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function WorkflowGuideDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>仮データ → 本データ運用ワークフロー</DialogTitle>
          <DialogDescription>
            仮データで先行実装し、本データ受領時に差し替えまたは再実装を行う際の
            状態遷移ルールです。本データ受領 (再実装あり) を記録すると、後続の
            実装工程は自動で「進行中」に巻き戻ります。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          <Step
            badge="①"
            title="仮データ受領 → ソフト実装着手"
            tone="amber"
            rows={[
              ["素材", "dataKind: 仮 / 影響度: 判定前 (or 事前評価)"],
              ["素材工程", "進行中（本データ未提出のため未完）"],
              ["映像実装/サウンド組込/ランプ", "進行中（仮データで先行実装可）"],
            ]}
          />
          <Step
            badge="②"
            title="ソフト側の仮実装が完了"
            tone="violet"
            rows={[
              ["素材", "仮データのまま"],
              [
                "素材工程",
                "進行中据え置き推奨（本データ未受領のため done にしない）",
              ],
              [
                "映像実装/サウンド/ランプ",
                "レビュー、または暫定 done で先に進めて良い",
              ],
            ]}
          />
          <Step
            badge="③"
            title="本データ受領（差し替えのみ＝swap）"
            tone="emerald"
            rows={[
              ["素材", "本データ / reworkRequired: false"],
              ["素材工程", "完了"],
              ["後続工程", "そのまま（仮実装を流用）"],
            ]}
          />
          <Step
            badge="④"
            title="本データ受領（再実装あり＝rework）"
            tone="rose"
            rows={[
              ["素材", "本データ / reworkRequired: true"],
              ["素材工程", "完了（素材自体は確定）"],
              [
                "後続工程",
                "自動で done/レビュー → 進行中 に巻き戻し（映像実装・サウンド組込・ランプ・最終確認）",
              ],
              ["映像実装タスク", "該当タスクを done → 進行中 に戻し再見積り"],
            ]}
          />
          <Step
            badge="⑤"
            title="再実装完了"
            tone="sky"
            rows={[
              ["素材", "「再実装完了」を記録 → reworkRequired: false"],
              ["後続工程", "進行中 → レビュー → 完了 に手動で進める"],
            ]}
          />
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-[11px] text-muted-foreground">
          <strong className="text-foreground">補足:</strong>{" "}
          外注・自社対応外で予実管理が不要な工程は、各工程カードの予実欄を
          開いて「予実管理を行う」をオフにしてください。集計対象外として
          表示されます。
        </div>

        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Step({
  badge,
  title,
  tone,
  rows,
}: {
  badge: string;
  title: string;
  tone: "amber" | "violet" | "emerald" | "rose" | "sky";
  rows: Array<[string, string]>;
}) {
  const toneClass = {
    amber: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
    violet: "bg-violet-500/15 text-violet-200 ring-violet-500/30",
    emerald: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
    rose: "bg-rose-500/15 text-rose-200 ring-rose-500/30",
    sky: "bg-sky-500/15 text-sky-200 ring-sky-500/30",
  }[tone];
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ring-1 ${toneClass}`}
        >
          {badge}
        </span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1 text-[11px]">
        {rows.map(([k, v], i) => (
          <Fragment key={i}>
            <dt className="text-muted-foreground">{k}</dt>
            <dd>{v}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}
