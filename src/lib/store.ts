"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  ActivityEntry,
  Asset,
  ChangeLog,
  Comment,
  Issue,
  LampCue,
  Machine,
  Phase,
  PhaseState,
  PhaseType,
  Production,
  Project,
  SoundCue,
  StoryboardScene,
  TimeEntry,
  User,
  WikiPage,
} from "./types";
import {
  seedActivities,
  seedComments,
  seedIssues,
  seedProjects,
  seedTimeEntries,
  seedUsers,
  seedWikiPages,
} from "./seed";
import {
  buildPachinkoSeed,
  pachinkoMachines,
  pachinkoUsers,
} from "./pachinko-seed";
import { PHASE_DEPENDENCIES } from "./labels";

const pachinkoSeed = buildPachinkoSeed();

const initialState = {
  currentUserId: "u-1",
  users: [...seedUsers, ...pachinkoUsers],
  projects: seedProjects,
  issues: seedIssues,
  comments: seedComments,
  changelogs: [] as ChangeLog[],
  wikiPages: seedWikiPages,
  activities: seedActivities,
  timeEntries: seedTimeEntries,
  machines: pachinkoMachines,
  productions: pachinkoSeed.productions,
  phases: pachinkoSeed.phases,
  scenes: pachinkoSeed.scenes,
  assets: pachinkoSeed.assets,
  soundCues: pachinkoSeed.soundCues,
  lampCues: pachinkoSeed.lampCues,
};

type InitialState = typeof initialState;

interface State extends InitialState {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setCurrentUser: (id: string) => void;
  createProject: (
    input: Omit<Project, "id" | "createdAt" | "memberIds"> & {
      memberIds?: string[];
    }
  ) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  archiveProject: (id: string, archived: boolean) => void;
  createIssue: (
    input: Omit<
      Issue,
      "id" | "number" | "createdAt" | "updatedAt" | "doneRatio" | "tags"
    > & { doneRatio?: number; tags?: string[] }
  ) => Issue;
  updateIssue: (id: string, patch: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;
  addComment: (issueId: string, body: string) => Comment | null;
  upsertWikiPage: (page: Omit<WikiPage, "id" | "updatedAt">) => WikiPage;
  logTime: (entry: Omit<TimeEntry, "id" | "createdAt">) => TimeEntry;
  resetData: () => void;
  // Pachinko domain actions
  updatePhase: (id: string, patch: Partial<Phase>) => void;
  updateScene: (id: string, patch: Partial<StoryboardScene>) => void;
  addScene: (
    productionId: string,
    init?: Partial<Omit<StoryboardScene, "id" | "productionId">>
  ) => StoryboardScene;
  removeScene: (id: string) => void;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  updateSoundCue: (id: string, patch: Partial<SoundCue>) => void;
  updateLampCue: (id: string, patch: Partial<LampCue>) => void;
  updateProduction: (id: string, patch: Partial<Production>) => void;
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

      createProject: (input) => {
        const project: Project = {
          id: `p-${nanoid(6)}`,
          createdAt: nowIso(),
          memberIds: input.memberIds ?? [get().currentUserId],
          ...input,
        };
        set((s) => {
          const activities = [...s.activities];
          pushActivity(
            { activities },
            {
              type: "project_created",
              actorId: get().currentUserId,
              projectId: project.id,
              message: `プロジェクト「${project.name}」を作成しました`,
            }
          );
          return { projects: [...s.projects, project], activities };
        });
        return project;
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        })),

      archiveProject: (id, archived) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, archived } : p
          ),
        })),

      createIssue: (input) => {
        const projectIssues = get().issues.filter(
          (i) => i.projectId === input.projectId
        );
        const number =
          projectIssues.reduce((max, i) => Math.max(max, i.number), 0) + 1;
        const issue: Issue = {
          id: `i-${nanoid(6)}`,
          number,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          doneRatio: input.doneRatio ?? 0,
          tags: input.tags ?? [],
          ...input,
        };
        set((s) => {
          const activities = [...s.activities];
          pushActivity(
            { activities },
            {
              type: "issue_created",
              actorId: get().currentUserId,
              projectId: issue.projectId,
              issueId: issue.id,
              message: `「${issue.subject}」を作成しました`,
            }
          );
          return { issues: [...s.issues, issue], activities };
        });
        return issue;
      },

      updateIssue: (id, patch) =>
        set((s) => {
          const prev = s.issues.find((i) => i.id === id);
          if (!prev) return s;
          const next: Issue = {
            ...prev,
            ...patch,
            updatedAt: nowIso(),
          };
          const issues = s.issues.map((i) => (i.id === id ? next : i));
          const changelogs = [...s.changelogs];
          const activities = [...s.activities];

          const trackedFields: (keyof Issue)[] = [
            "status",
            "priority",
            "assigneeId",
            "doneRatio",
            "tracker",
            "subject",
            "dueDate",
            "startDate",
          ];
          for (const f of trackedFields) {
            if (patch[f] !== undefined && prev[f] !== next[f]) {
              changelogs.push({
                id: `cl-${nanoid(6)}`,
                issueId: id,
                authorId: get().currentUserId,
                field: String(f),
                from: prev[f] === null || prev[f] === undefined
                  ? null
                  : String(prev[f]),
                to: next[f] === null || next[f] === undefined
                  ? null
                  : String(next[f]),
                createdAt: nowIso(),
              });
            }
          }
          if (
            patch.status &&
            (patch.status === "closed" || patch.status === "resolved") &&
            prev.status !== patch.status
          ) {
            pushActivity(
              { activities },
              {
                type: "issue_closed",
                actorId: get().currentUserId,
                projectId: next.projectId,
                issueId: next.id,
                message: `「${next.subject}」のステータスを更新しました`,
              }
            );
          } else if (Object.keys(patch).length > 0) {
            pushActivity(
              { activities },
              {
                type: "issue_updated",
                actorId: get().currentUserId,
                projectId: next.projectId,
                issueId: next.id,
                message: `「${next.subject}」を更新しました`,
              }
            );
          }

          return { issues, changelogs, activities };
        }),

      deleteIssue: (id) =>
        set((s) => ({
          issues: s.issues.filter((i) => i.id !== id),
          comments: s.comments.filter((c) => c.issueId !== id),
          changelogs: s.changelogs.filter((c) => c.issueId !== id),
        })),

      addComment: (issueId, body) => {
        const trimmed = body.trim();
        if (!trimmed) return null;
        const comment: Comment = {
          id: `c-${nanoid(6)}`,
          issueId,
          authorId: get().currentUserId,
          body: trimmed,
          createdAt: nowIso(),
        };
        set((s) => {
          const activities = [...s.activities];
          const issue = s.issues.find((i) => i.id === issueId);
          if (issue) {
            pushActivity(
              { activities },
              {
                type: "comment_added",
                actorId: get().currentUserId,
                projectId: issue.projectId,
                issueId: issue.id,
                message: `「${issue.subject}」にコメントしました`,
              }
            );
          }
          return { comments: [...s.comments, comment], activities };
        });
        return comment;
      },

      upsertWikiPage: (page) => {
        const existing = get().wikiPages.find(
          (w) => w.projectId === page.projectId && w.slug === page.slug
        );
        const next: WikiPage = existing
          ? { ...existing, ...page, updatedAt: nowIso() }
          : { ...page, id: `w-${nanoid(6)}`, updatedAt: nowIso() };
        set((s) => {
          const wikiPages = existing
            ? s.wikiPages.map((w) => (w.id === existing.id ? next : w))
            : [...s.wikiPages, next];
          const activities = [...s.activities];
          pushActivity(
            { activities },
            {
              type: "wiki_updated",
              actorId: get().currentUserId,
              projectId: page.projectId,
              message: `Wikiページ「${page.title}」を更新しました`,
            }
          );
          return { wikiPages, activities };
        });
        return next;
      },

      logTime: (entry) => {
        const created: TimeEntry = {
          id: `t-${nanoid(6)}`,
          createdAt: nowIso(),
          ...entry,
        };
        set((s) => ({ timeEntries: [...s.timeEntries, created] }));
        return created;
      },

      // === Pachinko domain ====================================================
      updatePhase: (id, patch) =>
        set((s) => {
          const phases = s.phases.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          );
          // 依存関係を再評価し、blocked / todo を切り替え
          const target = phases.find((p) => p.id === id);
          if (!target) return { phases };
          const productionPhases = phases.filter(
            (p) => p.productionId === target.productionId
          );
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
              (ph.state === "todo" || ph.state === "in_progress" || ph.state === "review")
            ) {
              if (ph.state === "todo") ph.state = "blocked";
            }
          }
          return { phases: phases.map((p) => ({ ...p })) };
        }),

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
        const endSec = startSec + (init?.endSec ? init.endSec - (init.startSec ?? 0) : 3);
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

      updateAsset: (id, patch) =>
        set((s) => ({
          assets: s.assets.map((a) =>
            a.id === id
              ? {
                  ...a,
                  ...patch,
                  updatedAt:
                    patch.state || patch.version || patch.fileLabel
                      ? nowIso()
                      : a.updatedAt,
                }
              : a
          ),
        })),

      updateSoundCue: (id, patch) =>
        set((s) => ({
          soundCues: s.soundCues.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),

      updateLampCue: (id, patch) =>
        set((s) => ({
          lampCues: s.lampCues.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),

      updateProduction: (id, patch) =>
        set((s) => ({
          productions: s.productions.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: nowIso() } : p
          ),
        })),

      resetData: () => set({ ...initialState, hydrated: true }),
    }),
    {
      name: "redmine-store",
      version: 1,
      partialize: ({ hydrated: _h, ...rest }) => rest,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
