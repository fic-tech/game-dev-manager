import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type {
  Role,
  Discipline,
  ProductionCategory,
  ProductionState,
  PhaseType,
  PhaseState,
  AssetCategory,
  AssetState,
  AssetDataKind,
  RevisionImpact,
  VideoTaskState,
  ActivityType,
} from "../types";

// ============================================================================
// users / sessions
// ============================================================================

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarHue: integer("avatar_hue").notNull(),
  role: text("role").$type<Role>().notNull(),
  discipline: text("discipline").$type<Discipline>(),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)]
);

// ============================================================================
// machines / machine_members
// ============================================================================

export const machines = sqliteTable("machines", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  series: text("series").notNull(),
  description: text("description").notNull(),
  color: text("color").notNull(),
  releaseTarget: text("release_target"),
  createdAt: text("created_at").notNull(),
});

export const machineMembers = sqliteTable(
  "machine_members",
  {
    machineId: text("machine_id")
      .notNull()
      .references(() => machines.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.machineId, t.userId] }),
    index("machine_members_user_idx").on(t.userId),
  ]
);

// ============================================================================
// productions / phases / video_tasks
// ============================================================================

export const productions = sqliteTable(
  "productions",
  {
    id: text("id").primaryKey(),
    machineId: text("machine_id")
      .notNull()
      .references(() => machines.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    category: text("category").$type<ProductionCategory>().notNull(),
    description: text("description").notNull(),
    durationSec: integer("duration_sec").notNull(),
    priority: text("priority")
      .$type<"low" | "normal" | "high" | "critical">()
      .notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id),
    state: text("state").$type<ProductionState>().notNull(),
    targetDate: text("target_date"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("productions_machine_code_unique").on(t.machineId, t.code),
    index("productions_owner_idx").on(t.ownerId),
  ]
);

export const phases = sqliteTable(
  "phases",
  {
    id: text("id").primaryKey(),
    productionId: text("production_id")
      .notNull()
      .references(() => productions.id, { onDelete: "cascade" }),
    type: text("type").$type<PhaseType>().notNull(),
    state: text("state").$type<PhaseState>().notNull(),
    assigneeId: text("assignee_id").references(() => users.id),
    estimatedHours: integer("estimated_hours"),
    actualHours: integer("actual_hours"),
    startDate: text("start_date"),
    dueDate: text("due_date"),
    completedAt: text("completed_at"),
    note: text("note").notNull().default(""),
    trackHours: integer("track_hours", { mode: "boolean" }),
  },
  (t) => [
    index("phases_production_idx").on(t.productionId),
    index("phases_assignee_idx").on(t.assigneeId),
  ]
);

export const videoTasks = sqliteTable(
  "video_tasks",
  {
    id: text("id").primaryKey(),
    productionId: text("production_id")
      .notNull()
      .references(() => productions.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    estimatedHours: integer("estimated_hours").notNull(),
    actualHours: integer("actual_hours"),
    assigneeId: text("assignee_id").references(() => users.id),
    state: text("state").$type<VideoTaskState>().notNull(),
  },
  (t) => [index("video_tasks_production_idx").on(t.productionId)]
);

// ============================================================================
// storyboard_scenes
// ============================================================================

export const storyboardScenes = sqliteTable(
  "storyboard_scenes",
  {
    id: text("id").primaryKey(),
    productionId: text("production_id")
      .notNull()
      .references(() => productions.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    startSec: integer("start_sec").notNull(),
    endSec: integer("end_sec").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    videoNote: text("video_note").notNull().default(""),
    soundNote: text("sound_note").notNull().default(""),
    lampNote: text("lamp_note").notNull().default(""),
    state: text("state").$type<"draft" | "fixed">().notNull(),
  },
  (t) => [index("scenes_production_idx").on(t.productionId)]
);

// ============================================================================
// assets
// ============================================================================

export const assets = sqliteTable(
  "assets",
  {
    id: text("id").primaryKey(),
    machineId: text("machine_id")
      .notNull()
      .references(() => machines.id, { onDelete: "cascade" }),
    productionId: text("production_id").references(() => productions.id, {
      onDelete: "set null",
    }),
    category: text("category").$type<AssetCategory>().notNull(),
    name: text("name").notNull(),
    fileLabel: text("file_label").notNull(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    state: text("state").$type<AssetState>().notNull(),
    version: integer("version").notNull(),
    updatedAt: text("updated_at").notNull(),
    thumbHue: integer("thumb_hue").notNull(),
    dataKind: text("data_kind").$type<AssetDataKind>().notNull(),
    revisionImpact: text("revision_impact").$type<RevisionImpact>().notNull(),
    finalDueDate: text("final_due_date"),
    finalReceivedAt: text("final_received_at"),
    reworkRequired: integer("rework_required", { mode: "boolean" }),
    reworkDoneAt: text("rework_done_at"),
  },
  (t) => [
    index("assets_machine_idx").on(t.machineId),
    index("assets_production_idx").on(t.productionId),
  ]
);

// ============================================================================
// sound_cues / lamp_cues
// ============================================================================

export const soundCues = sqliteTable(
  "sound_cues",
  {
    id: text("id").primaryKey(),
    productionId: text("production_id")
      .notNull()
      .references(() => productions.id, { onDelete: "cascade" }),
    sceneId: text("scene_id").references(() => storyboardScenes.id, {
      onDelete: "set null",
    }),
    type: text("type").$type<"bgm" | "se" | "voice">().notNull(),
    name: text("name").notNull(),
    state: text("state").$type<AssetState>().notNull(),
    assigneeId: text("assignee_id").references(() => users.id),
    note: text("note").notNull().default(""),
  },
  (t) => [index("sound_cues_production_idx").on(t.productionId)]
);

export const lampCues = sqliteTable(
  "lamp_cues",
  {
    id: text("id").primaryKey(),
    productionId: text("production_id")
      .notNull()
      .references(() => productions.id, { onDelete: "cascade" }),
    sceneId: text("scene_id").references(() => storyboardScenes.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    pattern: text("pattern").notNull(),
    /** colors は string[] を JSON 文字列で保存 */
    colorsJson: text("colors_json").notNull(),
    state: text("state").$type<AssetState>().notNull(),
    assigneeId: text("assignee_id").references(() => users.id),
    note: text("note").notNull().default(""),
  },
  (t) => [index("lamp_cues_production_idx").on(t.productionId)]
);

// ============================================================================
// activities
// ============================================================================

export const activities = sqliteTable(
  "activities",
  {
    id: text("id").primaryKey(),
    type: text("type").$type<ActivityType>().notNull(),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id),
    machineId: text("machine_id")
      .notNull()
      .references(() => machines.id, { onDelete: "cascade" }),
    productionId: text("production_id").references(() => productions.id, {
      onDelete: "set null",
    }),
    assetId: text("asset_id").references(() => assets.id, {
      onDelete: "set null",
    }),
    message: text("message").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("activities_created_at_idx").on(t.createdAt),
    index("activities_machine_idx").on(t.machineId),
  ]
);
