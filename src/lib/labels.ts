import type {
  IssuePriority,
  IssueStatus,
  IssueTracker,
} from "./types";

export const STATUS_LABEL: Record<IssueStatus, string> = {
  new: "新規",
  in_progress: "進行中",
  feedback: "フィードバック",
  resolved: "解決",
  closed: "完了",
  rejected: "却下",
};

export const PRIORITY_LABEL: Record<IssuePriority, string> = {
  low: "低",
  normal: "通常",
  high: "高",
  urgent: "緊急",
  immediate: "即時",
};

export const TRACKER_LABEL: Record<IssueTracker, string> = {
  bug: "バグ",
  feature: "機能",
  support: "サポート",
  task: "タスク",
};

export const STATUS_ORDER: IssueStatus[] = [
  "new",
  "in_progress",
  "feedback",
  "resolved",
  "closed",
  "rejected",
];

export const PRIORITY_ORDER: IssuePriority[] = [
  "low",
  "normal",
  "high",
  "urgent",
  "immediate",
];

export const TRACKER_ORDER: IssueTracker[] = [
  "feature",
  "bug",
  "task",
  "support",
];

export const STATUS_COLOR: Record<IssueStatus, string> = {
  new: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  in_progress: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  feedback: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30",
  resolved: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  closed: "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30",
  rejected: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
};

export const PRIORITY_COLOR: Record<IssuePriority, string> = {
  low: "text-slate-400",
  normal: "text-sky-400",
  high: "text-amber-400",
  urgent: "text-orange-400",
  immediate: "text-rose-400",
};

export const TRACKER_COLOR: Record<IssueTracker, string> = {
  bug: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
  feature: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30",
  support: "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30",
  task: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
};

import type {
  AssetCategory,
  AssetState,
  Discipline,
  PhaseState,
  PhaseType,
  ProductionCategory,
  ProductionState,
} from "./types";

export const DISCIPLINE_LABEL: Record<Discipline, string> = {
  director: "ディレクター",
  designer: "デザイナー",
  video: "ソフト (映像)",
  sound: "サウンド",
  lamp: "ソフト (ランプ)",
  qa: "QA",
};

export const DISCIPLINE_COLOR: Record<Discipline, string> = {
  director: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  designer: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30",
  video: "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30",
  sound: "bg-pink-500/15 text-pink-300 ring-1 ring-pink-500/30",
  lamp: "bg-yellow-500/15 text-yellow-200 ring-1 ring-yellow-500/30",
  qa: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
};

export const PHASE_LABEL: Record<PhaseType, string> = {
  vcon: "Vコンテ",
  asset: "素材",
  video: "映像実装",
  sound_compose: "サウンド作成",
  sound_impl: "サウンド組込",
  lamp: "ランプ演出",
  review: "最終確認",
};

export const PHASE_DISCIPLINE: Record<PhaseType, Discipline> = {
  vcon: "designer",
  asset: "designer",
  video: "video",
  sound_compose: "sound",
  sound_impl: "sound",
  lamp: "lamp",
  review: "director",
};

export const PHASE_ORDER: PhaseType[] = [
  "vcon",
  "asset",
  "video",
  "sound_compose",
  "sound_impl",
  "lamp",
  "review",
];

export const PHASE_DEPENDENCIES: Record<PhaseType, PhaseType[]> = {
  vcon: [],
  asset: ["vcon"],
  video: ["asset"],
  sound_compose: ["vcon"],
  sound_impl: ["video", "sound_compose"],
  lamp: ["video"],
  review: ["sound_impl", "lamp"],
};

export const PHASE_ACCENT: Record<PhaseType, string> = {
  vcon: "from-violet-500/40 to-violet-500/0 text-violet-200",
  asset: "from-fuchsia-500/40 to-fuchsia-500/0 text-fuchsia-200",
  video: "from-cyan-500/40 to-cyan-500/0 text-cyan-200",
  sound_compose: "from-pink-500/40 to-pink-500/0 text-pink-200",
  sound_impl: "from-rose-500/40 to-rose-500/0 text-rose-200",
  lamp: "from-yellow-500/40 to-yellow-500/0 text-yellow-200",
  review: "from-emerald-500/40 to-emerald-500/0 text-emerald-200",
};

export const PHASE_DOT: Record<PhaseType, string> = {
  vcon: "bg-violet-400",
  asset: "bg-fuchsia-400",
  video: "bg-cyan-400",
  sound_compose: "bg-pink-400",
  sound_impl: "bg-rose-400",
  lamp: "bg-yellow-300",
  review: "bg-emerald-400",
};

export const PHASE_STATE_LABEL: Record<PhaseState, string> = {
  blocked: "待機 (前工程未完)",
  todo: "未着手",
  in_progress: "進行中",
  review: "レビュー中",
  done: "完了",
};

export const PHASE_STATE_COLOR: Record<PhaseState, string> = {
  blocked: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/30",
  todo: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  in_progress: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  review: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30",
  done: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
};

export const PRODUCTION_CATEGORY_LABEL: Record<ProductionCategory, string> = {
  intro: "イントロ",
  general: "通常演出",
  preview: "予告",
  reach: "ノーマルリーチ",
  super_reach: "スーパーリーチ",
  fanfare: "ファンファーレ",
  bonus: "大当り中",
};

export const PRODUCTION_STATE_LABEL: Record<ProductionState, string> = {
  draft: "ドラフト",
  in_progress: "制作中",
  review: "確認中",
  completed: "完成",
  on_hold: "保留",
};

export const PRODUCTION_STATE_COLOR: Record<ProductionState, string> = {
  draft: "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30",
  in_progress: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  review: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  on_hold: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
};

export const ASSET_CATEGORY_LABEL: Record<AssetCategory, string> = {
  background: "背景",
  character: "キャラクター",
  effect: "エフェクト",
  ui: "UI",
  logo: "ロゴ",
  movie: "ムービー",
  bgm: "BGM",
  se: "SE",
  voice: "ボイス",
  lamp_pattern: "ランプパターン",
};

export const ASSET_DISCIPLINE: Record<AssetCategory, Discipline> = {
  background: "designer",
  character: "designer",
  effect: "designer",
  ui: "designer",
  logo: "designer",
  movie: "designer",
  bgm: "sound",
  se: "sound",
  voice: "sound",
  lamp_pattern: "lamp",
};

export const ASSET_STATE_LABEL: Record<AssetState, string> = {
  wip: "作業中",
  review: "レビュー中",
  approved: "承認済",
};

export const ASSET_STATE_COLOR: Record<AssetState, string> = {
  wip: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  review: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30",
  approved: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
};
