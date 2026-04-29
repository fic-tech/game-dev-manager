"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "../db/client";
import { requireUser } from "../auth/session";
import type { SoundCue } from "../types";

export async function addSoundCue(
  productionId: string,
  init?: Partial<Omit<SoundCue, "id" | "productionId">>
) {
  await requireUser();
  const id = `sc-${nanoid(6)}`;

  db.insert(schema.soundCues)
    .values({
      id,
      productionId,
      sceneId: init?.sceneId,
      type: init?.type ?? "bgm",
      name: init?.name ?? "新規サウンドCue",
      state: init?.state ?? "wip",
      assigneeId: init?.assigneeId ?? null,
      note: init?.note ?? "",
    })
    .run();

  revalidatePath("/", "layout");
  return { id };
}

export async function updateSoundCue(id: string, patch: Partial<SoundCue>) {
  await requireUser();
  db.update(schema.soundCues)
    .set({
      sceneId: patch.sceneId,
      type: patch.type,
      name: patch.name,
      state: patch.state,
      assigneeId: patch.assigneeId === undefined ? undefined : patch.assigneeId,
      note: patch.note,
    })
    .where(eq(schema.soundCues.id, id))
    .run();
  revalidatePath("/", "layout");
}

export async function removeSoundCue(id: string) {
  await requireUser();
  db.delete(schema.soundCues).where(eq(schema.soundCues.id, id)).run();
  revalidatePath("/", "layout");
}
