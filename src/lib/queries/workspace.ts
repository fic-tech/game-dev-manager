import "server-only";

import { desc } from "drizzle-orm";
import { db, schema } from "../db/client";
import type {
  ActivityEntry,
  Asset,
  LampCue,
  Machine,
  Phase,
  Production,
  SoundCue,
  StoryboardScene,
  User,
  VideoTask,
} from "../types";

export interface WorkspaceData {
  users: User[];
  machines: Machine[];
  productions: Production[];
  phases: Phase[];
  scenes: StoryboardScene[];
  assets: Asset[];
  soundCues: SoundCue[];
  lampCues: LampCue[];
  videoTasks: VideoTask[];
  activities: ActivityEntry[];
}

const undef = <T>(v: T | null | undefined): T | undefined =>
  v === null ? undefined : v;

export async function getWorkspaceData(): Promise<WorkspaceData> {
  const [
    userRows,
    machineRows,
    memberRows,
    productionRows,
    phaseRows,
    sceneRows,
    assetRows,
    soundCueRows,
    lampCueRows,
    videoTaskRows,
    activityRows,
  ] = await Promise.all([
    Promise.resolve(db.select().from(schema.users).all()),
    Promise.resolve(db.select().from(schema.machines).all()),
    Promise.resolve(db.select().from(schema.machineMembers).all()),
    Promise.resolve(db.select().from(schema.productions).all()),
    Promise.resolve(db.select().from(schema.phases).all()),
    Promise.resolve(db.select().from(schema.storyboardScenes).all()),
    Promise.resolve(db.select().from(schema.assets).all()),
    Promise.resolve(db.select().from(schema.soundCues).all()),
    Promise.resolve(db.select().from(schema.lampCues).all()),
    Promise.resolve(db.select().from(schema.videoTasks).all()),
    Promise.resolve(
      db
        .select()
        .from(schema.activities)
        .orderBy(desc(schema.activities.createdAt))
        .limit(200)
        .all()
    ),
  ]);

  const users: User[] = userRows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatarHue: u.avatarHue,
    role: u.role,
    discipline: undef(u.discipline),
  }));

  const machines: Machine[] = machineRows.map((m) => ({
    id: m.id,
    code: m.code,
    name: m.name,
    series: m.series,
    description: m.description,
    color: m.color,
    releaseTarget: undef(m.releaseTarget),
    memberIds: memberRows
      .filter((mb) => mb.machineId === m.id)
      .map((mb) => mb.userId),
    createdAt: m.createdAt,
  }));

  const productions: Production[] = productionRows.map((p) => ({
    id: p.id,
    machineId: p.machineId,
    code: p.code,
    name: p.name,
    category: p.category,
    description: p.description,
    durationSec: p.durationSec,
    priority: p.priority,
    ownerId: p.ownerId,
    state: p.state,
    targetDate: undef(p.targetDate),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  const phases: Phase[] = phaseRows.map((ph) => ({
    id: ph.id,
    productionId: ph.productionId,
    type: ph.type,
    state: ph.state,
    assigneeId: ph.assigneeId ?? null,
    estimatedHours: undef(ph.estimatedHours),
    actualHours: undef(ph.actualHours),
    startDate: undef(ph.startDate),
    dueDate: undef(ph.dueDate),
    completedAt: undef(ph.completedAt),
    note: ph.note ?? "",
    trackHours: ph.trackHours ?? undefined,
  }));

  const scenes: StoryboardScene[] = sceneRows
    .map((s) => ({
      id: s.id,
      productionId: s.productionId,
      order: s.order,
      startSec: s.startSec,
      endSec: s.endSec,
      title: s.title,
      description: s.description,
      videoNote: s.videoNote,
      soundNote: s.soundNote,
      lampNote: s.lampNote,
      state: s.state,
    }))
    .sort((a, b) =>
      a.productionId === b.productionId
        ? a.order - b.order
        : a.productionId.localeCompare(b.productionId)
    );

  const assets: Asset[] = assetRows.map((a) => ({
    id: a.id,
    machineId: a.machineId,
    productionId: undef(a.productionId),
    category: a.category,
    name: a.name,
    fileLabel: a.fileLabel,
    authorId: a.authorId,
    state: a.state,
    version: a.version,
    updatedAt: a.updatedAt,
    thumbHue: a.thumbHue,
    dataKind: a.dataKind,
    revisionImpact: a.revisionImpact,
    finalDueDate: undef(a.finalDueDate),
    finalReceivedAt: undef(a.finalReceivedAt),
    reworkRequired: a.reworkRequired ?? undefined,
    reworkDoneAt: undef(a.reworkDoneAt),
  }));

  const soundCues: SoundCue[] = soundCueRows.map((c) => ({
    id: c.id,
    productionId: c.productionId,
    sceneId: undef(c.sceneId),
    type: c.type,
    name: c.name,
    state: c.state,
    assigneeId: c.assigneeId ?? null,
    note: c.note,
  }));

  const lampCues: LampCue[] = lampCueRows.map((c) => {
    let colors: string[] = [];
    try {
      colors = JSON.parse(c.colorsJson);
      if (!Array.isArray(colors)) colors = [];
    } catch {
      colors = [];
    }
    return {
      id: c.id,
      productionId: c.productionId,
      sceneId: undef(c.sceneId),
      name: c.name,
      pattern: c.pattern,
      colors,
      state: c.state,
      assigneeId: c.assigneeId ?? null,
      note: c.note,
    };
  });

  const videoTasks: VideoTask[] = videoTaskRows
    .map((t) => ({
      id: t.id,
      productionId: t.productionId,
      order: t.order,
      name: t.name,
      description: t.description,
      estimatedHours: t.estimatedHours,
      actualHours: undef(t.actualHours),
      assigneeId: t.assigneeId ?? null,
      state: t.state,
    }))
    .sort((a, b) =>
      a.productionId === b.productionId
        ? a.order - b.order
        : a.productionId.localeCompare(b.productionId)
    );

  const activities: ActivityEntry[] = activityRows.map((a) => ({
    id: a.id,
    type: a.type,
    actorId: a.actorId,
    machineId: a.machineId,
    productionId: undef(a.productionId),
    assetId: undef(a.assetId),
    message: a.message,
    createdAt: a.createdAt,
  }));

  return {
    users,
    machines,
    productions,
    phases,
    scenes,
    assets,
    soundCues,
    lampCues,
    videoTasks,
    activities,
  };
}
