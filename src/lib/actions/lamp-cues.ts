"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "../db/client";
import { requireUser } from "../auth/session";
import type { LampCue } from "../types";

export async function addLampCue(
  productionId: string,
  init?: Partial<Omit<LampCue, "id" | "productionId">>
) {
  await requireUser();
  const id = `lc-${nanoid(6)}`;

  db.insert(schema.lampCues)
    .values({
      id,
      productionId,
      sceneId: init?.sceneId,
      name: init?.name ?? "新規ランプCue",
      pattern: init?.pattern ?? "fade",
      colorsJson: JSON.stringify(init?.colors ?? ["#f59e0b", "#ef4444"]),
      state: init?.state ?? "wip",
      assigneeId: init?.assigneeId ?? null,
      note: init?.note ?? "",
    })
    .run();

  revalidatePath("/", "layout");
  return { id };
}

export async function updateLampCue(id: string, patch: Partial<LampCue>) {
  await requireUser();
  db.update(schema.lampCues)
    .set({
      sceneId: patch.sceneId,
      name: patch.name,
      pattern: patch.pattern,
      colorsJson:
        patch.colors !== undefined ? JSON.stringify(patch.colors) : undefined,
      state: patch.state,
      assigneeId: patch.assigneeId === undefined ? undefined : patch.assigneeId,
      note: patch.note,
    })
    .where(eq(schema.lampCues.id, id))
    .run();
  revalidatePath("/", "layout");
}

export async function removeLampCue(id: string) {
  await requireUser();
  db.delete(schema.lampCues).where(eq(schema.lampCues.id, id)).run();
  revalidatePath("/", "layout");
}
