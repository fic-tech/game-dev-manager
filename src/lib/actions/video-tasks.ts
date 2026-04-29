"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "../db/client";
import { requireUser } from "../auth/session";
import type { VideoTask } from "../types";
import { syncVideoPhaseHours } from "./_helpers";

export async function addVideoTask(
  productionId: string,
  init?: Partial<Omit<VideoTask, "id" | "productionId" | "order">>
) {
  await requireUser();
  const id = `vt-${nanoid(6)}`;

  db.transaction((tx) => {
    const existing = tx
      .select()
      .from(schema.videoTasks)
      .where(eq(schema.videoTasks.productionId, productionId))
      .all();
    const order = existing.length + 1;

    tx.insert(schema.videoTasks)
      .values({
        id,
        productionId,
        order,
        name: init?.name ?? `タスク ${order}`,
        description: init?.description ?? "",
        estimatedHours: init?.estimatedHours ?? 0,
        actualHours: init?.actualHours,
        assigneeId: init?.assigneeId ?? null,
        state: init?.state ?? "todo",
      })
      .run();

    syncVideoPhaseHours(tx, productionId);
  });

  revalidatePath("/", "layout");
  return { id };
}

export async function updateVideoTask(id: string, patch: Partial<VideoTask>) {
  await requireUser();

  db.transaction((tx) => {
    const target = tx
      .select()
      .from(schema.videoTasks)
      .where(eq(schema.videoTasks.id, id))
      .get();
    if (!target) return;

    tx.update(schema.videoTasks)
      .set({
        order: patch.order,
        name: patch.name,
        description: patch.description,
        estimatedHours: patch.estimatedHours,
        actualHours: patch.actualHours,
        assigneeId: patch.assigneeId === undefined ? undefined : patch.assigneeId,
        state: patch.state,
      })
      .where(eq(schema.videoTasks.id, id))
      .run();

    syncVideoPhaseHours(tx, target.productionId);
  });

  revalidatePath("/", "layout");
}

export async function removeVideoTask(id: string) {
  await requireUser();

  db.transaction((tx) => {
    const removed = tx
      .select()
      .from(schema.videoTasks)
      .where(eq(schema.videoTasks.id, id))
      .get();
    if (!removed) return;

    tx.delete(schema.videoTasks).where(eq(schema.videoTasks.id, id)).run();

    // 同 production の order を 1 から振り直し
    const remaining = tx
      .select()
      .from(schema.videoTasks)
      .where(eq(schema.videoTasks.productionId, removed.productionId))
      .orderBy(asc(schema.videoTasks.order))
      .all();
    remaining.forEach((t, idx) => {
      const newOrder = idx + 1;
      if (t.order !== newOrder) {
        tx.update(schema.videoTasks)
          .set({ order: newOrder })
          .where(eq(schema.videoTasks.id, t.id))
          .run();
      }
    });

    syncVideoPhaseHours(tx, removed.productionId);
  });

  revalidatePath("/", "layout");
}
