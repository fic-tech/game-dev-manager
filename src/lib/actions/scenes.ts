"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "../db/client";
import { requireUser } from "../auth/session";
import type { StoryboardScene } from "../types";

export async function addScene(
  productionId: string,
  init?: Partial<Omit<StoryboardScene, "id" | "productionId">>
) {
  await requireUser();
  const id = `sc-${nanoid(6)}`;

  db.transaction((tx) => {
    const existing = tx
      .select()
      .from(schema.storyboardScenes)
      .where(eq(schema.storyboardScenes.productionId, productionId))
      .all()
      .sort((a, b) => a.order - b.order);
    const order = existing.length + 1;
    const last = existing.at(-1);
    const startSec = last ? last.endSec : 0;
    const endSec =
      startSec + (init?.endSec ? init.endSec - (init.startSec ?? 0) : 3);

    tx.insert(schema.storyboardScenes)
      .values({
        id,
        productionId,
        order,
        startSec: init?.startSec ?? startSec,
        endSec: init?.endSec ?? endSec,
        title: init?.title ?? `S${order}`,
        description: init?.description ?? "",
        videoNote: init?.videoNote ?? "",
        soundNote: init?.soundNote ?? "",
        lampNote: init?.lampNote ?? "",
        state: init?.state ?? "draft",
      })
      .run();
  });

  revalidatePath("/", "layout");
  return { id };
}

export async function updateScene(
  id: string,
  patch: Partial<StoryboardScene>
) {
  await requireUser();
  db.update(schema.storyboardScenes)
    .set({
      order: patch.order,
      startSec: patch.startSec,
      endSec: patch.endSec,
      title: patch.title,
      description: patch.description,
      videoNote: patch.videoNote,
      soundNote: patch.soundNote,
      lampNote: patch.lampNote,
      state: patch.state,
    })
    .where(eq(schema.storyboardScenes.id, id))
    .run();
  revalidatePath("/", "layout");
}

export async function removeScene(id: string) {
  await requireUser();
  db.delete(schema.storyboardScenes)
    .where(eq(schema.storyboardScenes.id, id))
    .run();
  revalidatePath("/", "layout");
}
