// ============================================================================
// 遊技機開発ワークスペース 型定義
// ============================================================================

export type Role = "manager" | "developer" | "reporter" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarHue: number;
  role: Role;
  discipline?: Discipline;
}

// === 遊技機開発ドメイン =====================================================

export type Discipline =
  | "director"
  | "designer"
  | "video"
  | "sound"
  | "lamp"
  | "qa";

export type ProductionCategory =
  | "general"
  | "preview"
  | "reach"
  | "super_reach"
  | "fanfare"
  | "bonus"
  | "intro";

export type ProductionState =
  | "draft"
  | "in_progress"
  | "review"
  | "completed"
  | "on_hold";

export type PhaseType =
  | "vcon"
  | "asset"
  | "video"
  | "sound_compose"
  | "sound_impl"
  | "lamp"
  | "review";

export type PhaseState =
  | "blocked"
  | "todo"
  | "in_progress"
  | "review"
  | "done";

export type AssetCategory =
  | "background"
  | "character"
  | "effect"
  | "ui"
  | "logo"
  | "movie"
  | "bgm"
  | "se"
  | "voice"
  | "lamp_pattern";

export type AssetState = "wip" | "review" | "approved";

/**
 * 素材種別。デザインデータは仮データとして提出されることがあり、後から本データに差し替わる。
 * - temp: 仮データ。実装中だが本データ受領を待っている
 * - final: 本データ受領済み
 */
export type AssetDataKind = "temp" | "final";

/**
 * 仮→本切り替え時のソフト側への影響度。プロジェクト初期は判断できないため unknown が初期値。
 * - unknown: 影響度判定前
 * - swap: 素材差し替えのみで完了する見込み (軽微)
 * - rework: タイミング・尺・構成変更を伴い再実装工数が発生
 */
export type RevisionImpact = "unknown" | "swap" | "rework";

export interface Machine {
  id: string;
  code: string;
  name: string;
  series: string;
  description: string;
  color: string;
  releaseTarget?: string;
  memberIds: string[];
  createdAt: string;
}

export interface Production {
  id: string;
  machineId: string;
  code: string;
  name: string;
  category: ProductionCategory;
  description: string;
  durationSec: number;
  priority: "low" | "normal" | "high" | "critical";
  ownerId: string;
  state: ProductionState;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Phase {
  id: string;
  productionId: string;
  type: PhaseType;
  state: PhaseState;
  assigneeId: string | null;
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  note: string;
  /**
   * 予実管理を行うかどうか。false の場合、外注や自社対応外として
   * 予実工数の集計から除外し、UI 上も「対象外」として表示する。
   * 未指定 (undefined) は true 扱い。
   */
  trackHours?: boolean;
}

export type VideoTaskState = "todo" | "in_progress" | "review" | "done";

/**
 * 映像実装の要件定義タスク。1つの演出 (video phase) 配下に複数定義し、
 * タスクごとに見積/実績工数を持つ。
 */
export interface VideoTask {
  id: string;
  productionId: string;
  order: number;
  name: string;
  description: string;
  estimatedHours: number;
  actualHours?: number;
  assigneeId: string | null;
  state: VideoTaskState;
}

export interface StoryboardScene {
  id: string;
  productionId: string;
  order: number;
  startSec: number;
  endSec: number;
  title: string;
  description: string;
  videoNote: string;
  soundNote: string;
  lampNote: string;
  state: "draft" | "fixed";
}

export interface Asset {
  id: string;
  machineId: string;
  productionId?: string;
  category: AssetCategory;
  name: string;
  fileLabel: string;
  authorId: string;
  state: AssetState;
  version: number;
  updatedAt: string;
  thumbHue: number;
  /** 仮/本データ。デフォルトは temp */
  dataKind: AssetDataKind;
  /** 仮→本受領時のソフト側影響度。temp の段階でも事前評価として設定できる */
  revisionImpact: RevisionImpact;
  /** 本データ提出予定日 (デザイン側からの提出予定) */
  finalDueDate?: string;
  /** 本データ受領日時 */
  finalReceivedAt?: string;
  /** 本データ受領後、再実装作業が残っているか (rework + 未対応のみ true) */
  reworkRequired?: boolean;
  /** 再実装完了日時 */
  reworkDoneAt?: string;
}

export interface SoundCue {
  id: string;
  productionId: string;
  sceneId?: string;
  type: "bgm" | "se" | "voice";
  name: string;
  state: AssetState;
  assigneeId: string | null;
  note: string;
}

export interface LampCue {
  id: string;
  productionId: string;
  sceneId?: string;
  name: string;
  pattern: string;
  colors: string[];
  state: AssetState;
  assigneeId: string | null;
  note: string;
}

/**
 * 機種ドメインのアクティビティ履歴。
 * machineId は必須、productionId / assetId は任意。
 */
export type ActivityType =
  | "production_updated"
  | "phase_updated"
  | "asset_received_final"
  | "asset_rework_done"
  | "member_assigned"
  | "machine_created"
  | "production_created";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  actorId: string;
  machineId: string;
  productionId?: string;
  assetId?: string;
  message: string;
  createdAt: string;
}
