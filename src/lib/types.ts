export type IssueStatus =
  | "new"
  | "in_progress"
  | "resolved"
  | "feedback"
  | "closed"
  | "rejected";

export type IssuePriority = "low" | "normal" | "high" | "urgent" | "immediate";

export type IssueTracker = "bug" | "feature" | "support" | "task";

export type Role = "manager" | "developer" | "reporter" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarHue: number;
  role: Role;
  discipline?: Discipline;
}

export interface Project {
  id: string;
  identifier: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  memberIds: string[];
  archived?: boolean;
}

export interface Comment {
  id: string;
  issueId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface ChangeLog {
  id: string;
  issueId: string;
  authorId: string;
  field: string;
  from: string | null;
  to: string | null;
  createdAt: string;
}

export interface Issue {
  id: string;
  projectId: string;
  number: number;
  subject: string;
  description: string;
  tracker: IssueTracker;
  status: IssueStatus;
  priority: IssuePriority;
  authorId: string;
  assigneeId: string | null;
  parentId: string | null;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  doneRatio: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WikiPage {
  id: string;
  projectId: string;
  slug: string;
  title: string;
  body: string;
  updatedAt: string;
  authorId: string;
}

export interface ActivityEntry {
  id: string;
  type:
    | "issue_created"
    | "issue_updated"
    | "issue_closed"
    | "comment_added"
    | "wiki_updated"
    | "project_created";
  actorId: string;
  projectId: string;
  issueId?: string;
  message: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  issueId: string;
  userId: string;
  hours: number;
  note: string;
  spentOn: string;
  createdAt: string;
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
