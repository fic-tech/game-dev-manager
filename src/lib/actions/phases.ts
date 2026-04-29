"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/client";
import { requireUser } from "../auth/session";
import { PHASE_DEPENDENCIES } from "../labels";
import type { Phase, PhaseState } from "../types";
import { pushActivity } from "./_helpers";

export async function updatePhase(id: string, patch: Partial<Phase>) {
  const me = await requireUser();

  db.transaction((tx) => {
    const target = tx
      .select()
      .from(schema.phases)
      .where(eq(schema.phases.id, id))
      .get();
    if (!target) return;

    // 自身を更新
    tx.update(schema.phases)
      .set({
        type: patch.type,
        state: patch.state,
        assigneeId: patch.assigneeId === undefined ? undefined : patch.assigneeId,
        estimatedHours: patch.estimatedHours,
        actualHours: patch.actualHours,
        startDate: patch.startDate,
        dueDate: patch.dueDate,
        completedAt: patch.completedAt,
        note: patch.note,
        trackHours: patch.trackHours,
      })
      .where(eq(schema.phases.id, id))
      .run();

    // 同 production の全 phase を再取得して依存関係を再評価
    const productionPhases = tx
      .select()
      .from(schema.phases)
      .where(eq(schema.phases.productionId, target.productionId))
      .all();

    for (const ph of productionPhases) {
      const deps = PHASE_DEPENDENCIES[ph.type];
      const allDepsDone = deps.every((d) => {
        const dp = productionPhases.find((x) => x.type === d);
        return dp?.state === "done";
      });
      let nextState: PhaseState | null = null;
      if (ph.state === "blocked" && allDepsDone) {
        nextState = "todo";
      } else if (!allDepsDone && ph.state === "todo") {
        nextState = "blocked";
      }
      if (nextState && nextState !== ph.state) {
        tx.update(schema.phases)
          .set({ state: nextState })
          .where(eq(schema.phases.id, ph.id))
          .run();
      }
    }

    if (patch.state) {
      const production = tx
        .select()
        .from(schema.productions)
        .where(eq(schema.productions.id, target.productionId))
        .get();
      if (production) {
        pushActivity(tx, {
          type: "phase_updated",
          actorId: me.id,
          machineId: production.machineId,
          productionId: production.id,
          message: `演出「${production.name}」の工程を更新しました`,
        });
      }
    }
  });

  revalidatePath("/", "layout");
}
