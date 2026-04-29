"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  ActivityEntry,
  ActivityType,
  Asset,
  LampCue,
  Machine,
  Phase,
  PhaseType,
  Production,
  RevisionImpact,
  SoundCue,
  StoryboardScene,
  User,
  VideoTask,
} from "./types";
import {
  buildPachinkoSeed,
  pachinkoMachines,
  pachinkoUsers,
} from "./pachinko-seed";
import { PHASE_DEPENDENCIES, PHASE_LABEL } from "./labels";

/** 本データ受領 (rework) で自動的に実装中に戻すべき後続工程 */
const REWORK_REOPEN_PHASES: PhaseType[] = [
  "video",
  "sound_impl",
  "lamp",
  "review",
];

/** 指定 production の video phase に VideoTask 合計を反映 */
const syncVideoPhaseHours = (
  phases: Phase[],
  videoTasks: VideoTask[],
  productionId: string
): Phase[] => {
  const tasks = videoTasks.filter((t) => t.productionId === productionId);
  const est = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
  const hasActual = tasks.some((t) => t.actualHours !== undefined);
  const act = hasActual
    ? tasks.reduce((s, t) => s + (t.actualHours ?? 0), 0)
    : undefined;
  return phases.map((ph) =>
    ph.productionId === productionId && ph.type === "video"
      ? { ...ph, estimatedHours: est, actualHours: act }
      : ph
  );
};

const pachinkoSeed = buildPachinkoSeed();

const initialState = {
  currentUserId: pachinkoUsers[0]?.id ?? "",
  users: [...pachinkoUsers] as User[],
  activities: [] as ActivityEntry[],
  machines: pachinkoMachines,
  productions: pachinkoSeed.productions,
  phases: pachinkoSeed.phases,
  scenes: pachinkoSeed.scenes,
  assets: pachinkoSeed.assets,
  soundCues: pachinkoSeed.soundCues,
  lampCues: pachinkoSeed.lampCues,
  videoTasks: pachinkoSeed.videoTasks,
};

type InitialState = typeof initialState;

interface State extends InitialState {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setCurrentUser: (id: string) => void;

  // ユーザ
  createUser: (
    input: Omit<User, "id" | "avatarHue"> & { avatarHue?: number }
  ) => User;
  updateUser: (id: string, patch: Partial<User>) => void;

  // 機種
  createMachine: (
    input: Omit<Machine, "id" | "createdAt" | "memberIds"> & {
      memberIds?: string[];
    }
  ) => Machine;
  updateMachine: (id: string, patch: Partial<Machine>) => void;
  createMachineMember: (machineId: string, userId: string) => void;
  removeMachineMember: (machineId: string, userId: string) => void;

  // 演出 / 工程
  updateProduction: (id: string, patch: Partial<Production>) => void;
  updatePhase: (id: string, patch: Partial<Phase>) => void;

  // シーン (Vコンテ)
  updateScene: (id: string, patch: Partial<StoryboardScene>) => void;
  addScene: (
    productionId: string,
    init?: Partial<Omit<StoryboardScene, "id" | "productionId">>
  ) => StoryboardScene;
  removeScene: (id: string) => void;

  // アセット
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  addAsset: (
    productionId: string,
    init?: Partial<Omit<Asset, "id" | "productionId" | "machineId">>
  ) => Asset | null;
  removeAsset: (id: string) => void;
  /** 仮データ → 本データへの切り替え。影響度を確定し、rework なら reworkRequired を立てる */
  markAssetFinal: (id: string, impact: RevisionImpact, note?: string) => void;
  /** 再実装作業の完了 */
  markAssetReworkDone: (id: string) => void;

  // Cue
  updateSoundCue: (id: string, patch: Partial<SoundCue>) => void;
  addSoundCue: (
    productionId: string,
    init?: Partial<Omit<SoundCue, "id" | "productionId">>
  ) => SoundCue;
  removeSoundCue: (id: string) => void;
  updateLampCue: (id: string, patch: Partial<LampCue>) => void;
  addLampCue: (
    productionId: string,
    init?: Partial<Omit<LampCue, "id" | "productionId">>
  ) => LampCue;
  removeLampCue: (id: string) => void;

  // 映像実装タスク (要件定義)
  addVideoTask: (
    productionId: string,
    init?: Partial<Omit<VideoTask, "id" | "productionId" | "order">>
  ) => VideoTask;
  updateVideoTask: (id: string, patch: Partial<VideoTask>) => void;
  removeVideoTask: (id: string) => void;

  resetData: () => void;
}

const nowIso = () => new Date().toISOString();

const pushActivity = (
  state: { activities: ActivityEntry[] },
  entry: Omit<ActivityEntry, "id" | "createdAt">
) => {
  state.activities = [
    {
      id: nanoid(8),
      createdAt: nowIso(),
      ...entry,
    },
    ...state.activities,
  ].slice(0, 200);
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initialState,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      setCurrentUser: (id) => set({ currentUserId: id }),

      // === ユーザ ===========================================================
      createUser: (input) => {
        const existingHues = get().users.map((u) => u.avatarHue);
        const autoHue =
          input.avatarHue ??
          ((existingHues.length * 47 + Math.floor(Math.random() * 30)) % 360);
        const user: User = {
          id: `u-${nanoid(6)}`,
          avatarHue: autoHue,
          ...input,
        };
        set((s) => ({ users: [...s.users, user] }));
        return user;
      },

      updateUser: (id, patch) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        })),

      // === 機種 =============================================================
      createMachine: (input) => {
        const machine: Machine = {
          id: `m-${nanoid(6)}`,
          createdAt: nowIso(),
          memberIds: input.memberIds ?? [get().currentUserId],
          ...input,
        };
        set((s) => {
          const activities = [...s.activities];
          pushActivity(
            { activities },
            {
              type: "machine_created",
              actorId: get().currentUserId,
              machineId: machine.id,
              message: `機種「${machine.name}」を登録しました`,
            }
          );
          return { machines: [...s.machines, machine], activities };
        });
        return machine;
      },

      updateMachine: (id, patch) =>
        set((s) => ({
          machines: s.machines.map((m) =>
            m.id === id ? { ...m, ...patch } : m
          ),
        })),

      createMachineMember: (machineId, userId) =>
        set((s) => {
          const machine = s.machines.find((m) => m.id === machineId);
          if (!machine || machine.memberIds.includes(userId)) return s;
          const machines = s.machines.map((m) =>
            m.id === machineId
              ? { ...m, memberIds: [...m.memberIds, userId] }
              : m
          );
          const user = s.users.find((u) => u.id === userId);
          const activities = [...s.activities];
          pushActivity(
            { activities },
            {
              type: "member_assigned",
              actorId: get().currentUserId,
              machineId,
              message: `「${user?.name ?? "メンバー"}」を機種「${machine.name}」にアサインしました`,
            }
          );
          return { machines, activities };
        }),

      removeMachineMember: (machineId, userId) =>
        set((s) => ({
          machines: s.machines.map((m) =>
            m.id === machineId
              ? { ...m, memberIds: m.memberIds.filter((id) => id !== userId) }
              : m
          ),
        })),

      // === 演出 / 工程 ======================================================
      updateProduction: (id, patch) =>
        set((s) => {
          const prev = s.productions.find((p) => p.id === id);
          if (!prev) return s;
          const next = { ...prev, ...patch, updatedAt: nowIso() };
          const productions = s.productions.map((p) =>
            p.id === id ? next : p
          );
          const activities = [...s.activities];
          if (patch.state && patch.state !== prev.state) {
            pushActivity(
              { activities },
              {
                type: "production_updated",
                actorId: get().currentUserId,
                machineId: next.machineId,
                productionId: next.id,
                message: `演出「${next.name}」のステータスを変更しました`,
              }
            );
          }
          return { productions, activities };
        }),

      updatePhase: (id, patch) =>
        set((s) => {
          const phases = s.phases.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          );
          const target = phases.find((p) => p.id === id);
          if (!target) return { phases };
          const productionPhases = phases.filter(
            (p) => p.productionId === target.productionId
          );
          // 依存関係を再評価し、blocked / todo を切り替え
          for (const ph of productionPhases) {
            const deps = PHASE_DEPENDENCIES[ph.type];
            const allDepsDone = deps.every((d) => {
              const dp = productionPhases.find((x) => x.type === d);
              return dp?.state === "done";
            });
            if (ph.state === "blocked" && allDepsDone) {
              ph.state = "todo";
            } else if (
              !allDepsDone &&
              (ph.state === "todo" ||
                ph.state === "in_progress" ||
                ph.state === "review")
            ) {
              if (ph.state === "todo") ph.state = "blocked";
            }
          }
          const production = s.productions.find(
            (p) => p.id === target.productionId
          );
          const activities = [...s.activities];
          if (patch.state && production) {
            pushActivity(
              { activities },
              {
                type: "phase_updated",
                actorId: get().currentUserId,
                machineId: production.machineId,
                productionId: production.id,
                message: `演出「${production.name}」の工程を更新しました`,
              }
            );
          }
          return { phases: phases.map((p) => ({ ...p })), activities };
        }),

      // === Vコンテ シーン ===================================================
      updateScene: (id, patch) =>
        set((s) => ({
          scenes: s.scenes.map((sc) =>
            sc.id === id ? { ...sc, ...patch } : sc
          ),
        })),

      addScene: (productionId, init) => {
        const existing = get().scenes.filter(
          (s) => s.productionId === productionId
        );
        const order = existing.length + 1;
        const last = existing.at(-1);
        const startSec = last ? last.endSec : 0;
        const endSec =
          startSec + (init?.endSec ? init.endSec - (init.startSec ?? 0) : 3);
        const scene: StoryboardScene = {
          id: `sc-${nanoid(6)}`,
          productionId,
          order,
          startSec,
          endSec,
          title: init?.title ?? `S${order}`,
          description: init?.description ?? "",
          videoNote: init?.videoNote ?? "",
          soundNote: init?.soundNote ?? "",
          lampNote: init?.lampNote ?? "",
          state: init?.state ?? "draft",
        };
        set((s) => ({ scenes: [...s.scenes, scene] }));
        return scene;
      },

      removeScene: (id) =>
        set((s) => ({ scenes: s.scenes.filter((sc) => sc.id !== id) })),

      // === アセット =========================================================
      updateAsset: (id, patch) =>
        set((s) => ({
          assets: s.assets.map((a) =>
            a.id === id
              ? {
                  ...a,
                  ...patch,
                  updatedAt:
                    patch.state ||
                    patch.version ||
                    patch.fileLabel ||
                    patch.dataKind ||
                    patch.revisionImpact ||
                    patch.name ||
                    patch.category
                      ? nowIso()
                      : a.updatedAt,
                }
              : a
          ),
        })),

      addAsset: (productionId, init) => {
        const production = get().productions.find((p) => p.id === productionId);
        if (!production) return null;
        const existing = get().assets.filter(
          (a) => a.productionId === productionId
        );
        const asset: Asset = {
          id: `as-${nanoid(6)}`,
          machineId: production.machineId,
          productionId,
          category: init?.category ?? "background",
          name: init?.name ?? "新規アセット",
          fileLabel: init?.fileLabel ?? "",
          authorId: init?.authorId ?? get().currentUserId,
          state: init?.state ?? "wip",
          version: init?.version ?? 1,
          updatedAt: nowIso(),
          thumbHue: init?.thumbHue ?? Math.floor(Math.random() * 360),
          dataKind: init?.dataKind ?? "temp",
          revisionImpact: init?.revisionImpact ?? "unknown",
          finalDueDate: init?.finalDueDate,
          finalReceivedAt: init?.finalReceivedAt,
          reworkRequired: init?.reworkRequired,
          reworkDoneAt: init?.reworkDoneAt,
        };
        set((s) => ({ assets: [...s.assets, asset] }));
        return asset;
      },

      removeAsset: (id) =>
        set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),

      markAssetFinal: (id, impact, note) =>
        set((s) => {
          const asset = s.assets.find((a) => a.id === id);
          if (!asset) return s;
          const next: Asset = {
            ...asset,
            dataKind: "final",
            revisionImpact: impact,
            finalReceivedAt: nowIso(),
            reworkRequired: impact === "rework",
            updatedAt: nowIso(),
            version: asset.version + 1,
          };
          const assets = s.assets.map((a) => (a.id === id ? next : a));

          // 再実装ありの場合、後続実装工程を done/review から in_progress に巻き戻す
          let phases = s.phases;
          const reopenedTypes: PhaseType[] = [];
          if (impact === "rework" && asset.productionId) {
            phases = s.phases.map((ph) => {
              if (ph.productionId !== asset.productionId) return ph;
              if (!REWORK_REOPEN_PHASES.includes(ph.type)) return ph;
              if (ph.state === "done" || ph.state === "review") {
                reopenedTypes.push(ph.type);
                return {
                  ...ph,
                  state: "in_progress" as const,
                  completedAt: undefined,
                };
              }
              return ph;
            });
          }

          const activities = [...s.activities];
          const production = asset.productionId
            ? s.productions.find((p) => p.id === asset.productionId)
            : null;
          const machineId = production?.machineId ?? asset.machineId;
          const impactLabel =
            impact === "rework"
              ? "再実装あり"
              : impact === "swap"
                ? "差し替えのみ"
                : "影響度未確定";
          pushActivity(
            { activities },
            {
              type: "asset_received_final",
              actorId: get().currentUserId,
              machineId,
              productionId: production?.id,
              assetId: asset.id,
              message: `本データ受領: 「${asset.name}」(${impactLabel})${note ? ` — ${note}` : ""}`,
            }
          );
          if (reopenedTypes.length > 0 && production) {
            const labels = reopenedTypes
              .map((t) => PHASE_LABEL[t])
              .join(" / ");
            pushActivity(
              { activities },
              {
                type: "phase_updated",
                actorId: get().currentUserId,
                machineId,
                productionId: production.id,
                message: `本データ「${asset.name}」受領により、${labels} を実装中に戻しました`,
              }
            );
          }
          return { assets, phases, activities };
        }),

      markAssetReworkDone: (id) =>
        set((s) => {
          const asset = s.assets.find((a) => a.id === id);
          if (!asset) return s;
          const assets = s.assets.map((a) =>
            a.id === id
              ? {
                  ...a,
                  reworkRequired: false,
                  reworkDoneAt: nowIso(),
                  updatedAt: nowIso(),
                }
              : a
          );
          const production = asset.productionId
            ? s.productions.find((p) => p.id === asset.productionId)
            : null;
          const machineId = production?.machineId ?? asset.machineId;
          const activities = [...s.activities];
          pushActivity(
            { activities },
            {
              type: "asset_rework_done",
              actorId: get().currentUserId,
              machineId,
              productionId: production?.id,
              assetId: asset.id,
              message: `「${asset.name}」の再実装を完了しました`,
            }
          );
          return { assets, activities };
        }),

      // === Cue ==============================================================
      updateSoundCue: (id, patch) =>
        set((s) => ({
          soundCues: s.soundCues.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),

      addSoundCue: (productionId, init) => {
        const cue: SoundCue = {
          id: `sc-${nanoid(6)}`,
          productionId,
          sceneId: init?.sceneId,
          type: init?.type ?? "bgm",
          name: init?.name ?? "新規サウンドCue",
          state: init?.state ?? "wip",
          assigneeId: init?.assigneeId ?? null,
          note: init?.note ?? "",
        };
        set((s) => ({ soundCues: [...s.soundCues, cue] }));
        return cue;
      },

      removeSoundCue: (id) =>
        set((s) => ({ soundCues: s.soundCues.filter((c) => c.id !== id) })),

      updateLampCue: (id, patch) =>
        set((s) => ({
          lampCues: s.lampCues.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),

      addLampCue: (productionId, init) => {
        const cue: LampCue = {
          id: `lc-${nanoid(6)}`,
          productionId,
          sceneId: init?.sceneId,
          name: init?.name ?? "新規ランプCue",
          pattern: init?.pattern ?? "fade",
          colors: init?.colors ?? ["#f59e0b", "#ef4444"],
          state: init?.state ?? "wip",
          assigneeId: init?.assigneeId ?? null,
          note: init?.note ?? "",
        };
        set((s) => ({ lampCues: [...s.lampCues, cue] }));
        return cue;
      },

      removeLampCue: (id) =>
        set((s) => ({ lampCues: s.lampCues.filter((c) => c.id !== id) })),

      // === 映像実装タスク ===================================================
      addVideoTask: (productionId, init) => {
        const existing = get().videoTasks.filter(
          (t) => t.productionId === productionId
        );
        const order = existing.length + 1;
        const task: VideoTask = {
          id: `vt-${nanoid(6)}`,
          productionId,
          order,
          name: init?.name ?? `タスク ${order}`,
          description: init?.description ?? "",
          estimatedHours: init?.estimatedHours ?? 0,
          actualHours: init?.actualHours,
          assigneeId: init?.assigneeId ?? null,
          state: init?.state ?? "todo",
        };
        set((s) => {
          const videoTasks = [...s.videoTasks, task];
          const phases = syncVideoPhaseHours(s.phases, videoTasks, productionId);
          return { videoTasks, phases };
        });
        return task;
      },

      updateVideoTask: (id, patch) =>
        set((s) => {
          const videoTasks = s.videoTasks.map((t) =>
            t.id === id ? { ...t, ...patch } : t
          );
          const target = s.videoTasks.find((t) => t.id === id);
          const phases = target
            ? syncVideoPhaseHours(s.phases, videoTasks, target.productionId)
            : s.phases;
          return { videoTasks, phases };
        }),

      removeVideoTask: (id) =>
        set((s) => {
          const removed = s.videoTasks.find((t) => t.id === id);
          const filtered = s.videoTasks.filter((t) => t.id !== id);
          if (!removed) return { videoTasks: filtered };
          // 同 production の order を振り直す
          const renumbered = filtered.map((t) => {
            if (t.productionId !== removed.productionId) return t;
            const peers = filtered
              .filter((p) => p.productionId === removed.productionId)
              .sort((a, b) => a.order - b.order);
            const idx = peers.findIndex((p) => p.id === t.id);
            return idx >= 0 ? { ...t, order: idx + 1 } : t;
          });
          const phases = syncVideoPhaseHours(
            s.phases,
            renumbered,
            removed.productionId
          );
          return { videoTasks: renumbered, phases };
        }),

      resetData: () => set({ ...initialState, hydrated: true }),
    }),
    {
      name: "redmine-store",
      version: 5,
      partialize: ({ hydrated: _h, ...rest }) => rest,
      migrate: (persisted, version) => {
        // v1〜v4 (videoTasks 未対応 / video phase 未同期) は破棄して再シード。
        if (!persisted || typeof persisted !== "object") return persisted;
        if (version < 5) {
          return undefined as unknown;
        }
        return persisted;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

// 未使用の型 import を保持 (将来用)
export type { ActivityType };
