import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import bcrypt from "bcryptjs";
import * as schema from "./schema";
import {
  buildPachinkoSeed,
  pachinkoMachines,
  pachinkoUsers,
} from "../pachinko-seed";

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "redmine.db");

if (!fs.existsSync(DB_PATH)) {
  console.error(
    "DB not found. Run `npm run db:migrate` first."
  );
  process.exit(1);
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

const seed = buildPachinkoSeed();
const now = new Date().toISOString();
const defaultPasswordHash = bcrypt.hashSync("password", 10);
const adminPasswordHash = bcrypt.hashSync("admin", 10);

db.transaction((tx) => {
  // 既存データを全消去（順序に注意）
  tx.delete(schema.activities).run();
  tx.delete(schema.lampCues).run();
  tx.delete(schema.soundCues).run();
  tx.delete(schema.assets).run();
  tx.delete(schema.storyboardScenes).run();
  tx.delete(schema.videoTasks).run();
  tx.delete(schema.phases).run();
  tx.delete(schema.productions).run();
  tx.delete(schema.machineMembers).run();
  tx.delete(schema.machines).run();
  tx.delete(schema.sessions).run();
  tx.delete(schema.users).run();

  // users
  for (const u of pachinkoUsers) {
    tx.insert(schema.users)
      .values({
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: defaultPasswordHash,
        avatarHue: u.avatarHue,
        role: u.role,
        discipline: u.discipline,
        createdAt: now,
      })
      .run();
  }
  // 管理者ユーザを追加
  tx.insert(schema.users)
    .values({
      id: "u-admin",
      name: "管理者",
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      avatarHue: 220,
      role: "manager",
      discipline: undefined,
      createdAt: now,
    })
    .run();

  // machines + machine_members
  for (const m of pachinkoMachines) {
    tx.insert(schema.machines)
      .values({
        id: m.id,
        code: m.code,
        name: m.name,
        series: m.series,
        description: m.description,
        color: m.color,
        releaseTarget: m.releaseTarget,
        createdAt: m.createdAt,
      })
      .run();
    for (const userId of m.memberIds) {
      tx.insert(schema.machineMembers)
        .values({ machineId: m.id, userId })
        .run();
    }
  }

  // productions
  for (const p of seed.productions) {
    tx.insert(schema.productions)
      .values({
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
        targetDate: p.targetDate,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })
      .run();
  }

  // phases
  for (const ph of seed.phases) {
    tx.insert(schema.phases)
      .values({
        id: ph.id,
        productionId: ph.productionId,
        type: ph.type,
        state: ph.state,
        assigneeId: ph.assigneeId,
        estimatedHours: ph.estimatedHours,
        actualHours: ph.actualHours,
        startDate: ph.startDate,
        dueDate: ph.dueDate,
        completedAt: ph.completedAt,
        note: ph.note ?? "",
        trackHours: ph.trackHours,
      })
      .run();
  }

  // storyboard_scenes
  for (const s of seed.scenes) {
    tx.insert(schema.storyboardScenes)
      .values({
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
      })
      .run();
  }

  // assets
  for (const a of seed.assets) {
    tx.insert(schema.assets)
      .values({
        id: a.id,
        machineId: a.machineId,
        productionId: a.productionId,
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
        finalDueDate: a.finalDueDate,
        finalReceivedAt: a.finalReceivedAt,
        reworkRequired: a.reworkRequired,
        reworkDoneAt: a.reworkDoneAt,
      })
      .run();
  }

  // sound_cues
  for (const c of seed.soundCues) {
    tx.insert(schema.soundCues)
      .values({
        id: c.id,
        productionId: c.productionId,
        sceneId: c.sceneId,
        type: c.type,
        name: c.name,
        state: c.state,
        assigneeId: c.assigneeId,
        note: c.note,
      })
      .run();
  }

  // lamp_cues
  for (const c of seed.lampCues) {
    tx.insert(schema.lampCues)
      .values({
        id: c.id,
        productionId: c.productionId,
        sceneId: c.sceneId,
        name: c.name,
        pattern: c.pattern,
        colorsJson: JSON.stringify(c.colors),
        state: c.state,
        assigneeId: c.assigneeId,
        note: c.note,
      })
      .run();
  }

  // video_tasks
  for (const t of seed.videoTasks) {
    tx.insert(schema.videoTasks)
      .values({
        id: t.id,
        productionId: t.productionId,
        order: t.order,
        name: t.name,
        description: t.description,
        estimatedHours: t.estimatedHours,
        actualHours: t.actualHours,
        assigneeId: t.assigneeId,
        state: t.state,
      })
      .run();
  }
});

console.log("✓ seed completed:");
console.log(`  users:       ${pachinkoUsers.length + 1} (含 admin)`);
console.log(`  machines:    ${pachinkoMachines.length}`);
console.log(`  productions: ${seed.productions.length}`);
console.log(`  phases:      ${seed.phases.length}`);
console.log(`  scenes:      ${seed.scenes.length}`);
console.log(`  assets:      ${seed.assets.length}`);
console.log(`  sound_cues:  ${seed.soundCues.length}`);
console.log(`  lamp_cues:   ${seed.lampCues.length}`);
console.log(`  video_tasks: ${seed.videoTasks.length}`);
console.log("");
console.log("初期ログイン情報:");
console.log("  admin@example.com / admin       (管理者)");
console.log("  tsuji@example.com / password    (各シードユーザは password)");

sqlite.close();
