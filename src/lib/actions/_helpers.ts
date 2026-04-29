import "server-only";

import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "../db/client";
import type { ActivityEntry, ActivityType } from "../types";

export const nowIso = () => new Date().toISOString();

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface ActivityInput {
  type: ActivityType;
  actorId: string;
  machineId: string;
  productionId?: string;
  assetId?: string;
  message: string;
}

/**
 * activities への追記。最新200件を超えた古いレコードは削除する。
 * トランザクション内で呼ぶ前提。
 */
export function pushActivity(tx: Tx, entry: ActivityInput): ActivityEntry {
  const row = {
    id: nanoid(8),
    type: entry.type,
    actorId: entry.actorId,
    machineId: entry.machineId,
    productionId: entry.productionId ?? null,
    assetId: entry.assetId ?? null,
    message: entry.message,
    createdAt: nowIso(),
  };
  tx.insert(schema.activities).values(row).run();

  // 200件超過分を削除（最新200件以外を削除）
  tx.run(sql`
    DELETE FROM activities
    WHERE id NOT IN (
      SELECT id FROM activities ORDER BY created_at DESC LIMIT 200
    )
  `);

  return {
    id: row.id,
    type: row.type,
    actorId: row.actorId,
    machineId: row.machineId,
    productionId: row.productionId ?? undefined,
    assetId: row.assetId ?? undefined,
    message: row.message,
    createdAt: row.createdAt,
  };
}

/** 指定 production の video phase に VideoTask 合計を反映 (tx 内で呼ぶ) */
export function syncVideoPhaseHours(tx: Tx, productionId: string): void {
  const tasks = tx
    .select()
    .from(schema.videoTasks)
    .all()
    .filter((t) => t.productionId === productionId);

  const est = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
  const hasActual = tasks.some((t) => t.actualHours !== null);
  const act = hasActual
    ? tasks.reduce((s, t) => s + (t.actualHours ?? 0), 0)
    : null;

  tx.update(schema.phases)
    .set({ estimatedHours: est, actualHours: act })
    .where(
      sql`${schema.phases.productionId} = ${productionId} AND ${schema.phases.type} = 'video'`
    )
    .run();
}
