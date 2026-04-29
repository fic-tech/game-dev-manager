"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/client";
import { requireUser } from "../auth/session";
import type { Production } from "../types";
import { nowIso, pushActivity } from "./_helpers";

export async function updateProduction(
  id: string,
  patch: Partial<Production>
) {
  const me = await requireUser();

  db.transaction((tx) => {
    const prev = tx
      .select()
      .from(schema.productions)
      .where(eq(schema.productions.id, id))
      .get();
    if (!prev) return;

    tx.update(schema.productions)
      .set({
        machineId: patch.machineId,
        code: patch.code,
        name: patch.name,
        category: patch.category,
        description: patch.description,
        durationSec: patch.durationSec,
        priority: patch.priority,
        ownerId: patch.ownerId,
        state: patch.state,
        targetDate: patch.targetDate,
        updatedAt: nowIso(),
      })
      .where(eq(schema.productions.id, id))
      .run();

    if (patch.state && patch.state !== prev.state) {
      pushActivity(tx, {
        type: "production_updated",
        actorId: me.id,
        machineId: prev.machineId,
        productionId: id,
        message: `演出「${prev.name}」のステータスを変更しました`,
      });
    }
  });

  revalidatePath("/", "layout");
}
