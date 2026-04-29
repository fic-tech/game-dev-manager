"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "../db/client";
import { requireUser } from "../auth/session";
import { PHASE_LABEL } from "../labels";
import type { Asset, PhaseType, RevisionImpact } from "../types";
import { nowIso, pushActivity } from "./_helpers";

const REWORK_REOPEN_PHASES: PhaseType[] = [
  "video",
  "sound_impl",
  "lamp",
  "review",
];

export async function addAsset(
  productionId: string,
  init?: Partial<Omit<Asset, "id" | "productionId" | "machineId">>
) {
  const me = await requireUser();
  const id = `as-${nanoid(6)}`;

  let assetId: string | null = null;
  db.transaction((tx) => {
    const production = tx
      .select()
      .from(schema.productions)
      .where(eq(schema.productions.id, productionId))
      .get();
    if (!production) return;

    tx.insert(schema.assets)
      .values({
        id,
        machineId: production.machineId,
        productionId,
        category: init?.category ?? "background",
        name: init?.name ?? "新規アセット",
        fileLabel: init?.fileLabel ?? "",
        authorId: init?.authorId ?? me.id,
        state: init?.state ?? "wip",
        version: init?.version ?? 1,
        updatedAt: nowIso(),
        thumbHue: init?.thumbHue ?? Math.floor(Math.random() * 360),
        dataKind: init?.dataKind ?? "temp",
        revisionImpact: init?.revisionImpact ?? "unknown",
        finalDueDate: init?.finalDueDate,
        finalReceivedAt: init?.finalReceivedAt,
        reworkRequired: init?.reworkRequired,
        reworkDoneAt: init?.reworkDoneAt,
      })
      .run();
    assetId = id;
  });

  revalidatePath("/", "layout");
  return assetId ? { id: assetId } : null;
}

export async function updateAsset(id: string, patch: Partial<Asset>) {
  await requireUser();

  const shouldBumpUpdatedAt =
    patch.state !== undefined ||
    patch.version !== undefined ||
    patch.fileLabel !== undefined ||
    patch.dataKind !== undefined ||
    patch.revisionImpact !== undefined ||
    patch.name !== undefined ||
    patch.category !== undefined;

  db.update(schema.assets)
    .set({
      machineId: patch.machineId,
      productionId: patch.productionId,
      category: patch.category,
      name: patch.name,
      fileLabel: patch.fileLabel,
      authorId: patch.authorId,
      state: patch.state,
      version: patch.version,
      updatedAt: shouldBumpUpdatedAt ? nowIso() : undefined,
      thumbHue: patch.thumbHue,
      dataKind: patch.dataKind,
      revisionImpact: patch.revisionImpact,
      finalDueDate: patch.finalDueDate,
      finalReceivedAt: patch.finalReceivedAt,
      reworkRequired: patch.reworkRequired,
      reworkDoneAt: patch.reworkDoneAt,
    })
    .where(eq(schema.assets.id, id))
    .run();

  revalidatePath("/", "layout");
}

export async function removeAsset(id: string) {
  await requireUser();
  db.delete(schema.assets).where(eq(schema.assets.id, id)).run();
  revalidatePath("/", "layout");
}

export async function markAssetFinal(
  id: string,
  impact: RevisionImpact,
  note?: string
) {
  const me = await requireUser();

  db.transaction((tx) => {
    const asset = tx
      .select()
      .from(schema.assets)
      .where(eq(schema.assets.id, id))
      .get();
    if (!asset) return;

    const now = nowIso();
    tx.update(schema.assets)
      .set({
        dataKind: "final",
        revisionImpact: impact,
        finalReceivedAt: now,
        reworkRequired: impact === "rework",
        updatedAt: now,
        version: asset.version + 1,
      })
      .where(eq(schema.assets.id, id))
      .run();

    const reopenedTypes: PhaseType[] = [];
    if (impact === "rework" && asset.productionId) {
      const targetPhases = tx
        .select()
        .from(schema.phases)
        .where(
          and(
            eq(schema.phases.productionId, asset.productionId),
            inArray(schema.phases.type, REWORK_REOPEN_PHASES)
          )
        )
        .all();
      for (const ph of targetPhases) {
        if (ph.state === "done" || ph.state === "review") {
          reopenedTypes.push(ph.type);
          tx.update(schema.phases)
            .set({ state: "in_progress", completedAt: null })
            .where(eq(schema.phases.id, ph.id))
            .run();
        }
      }
    }

    const production = asset.productionId
      ? tx
          .select()
          .from(schema.productions)
          .where(eq(schema.productions.id, asset.productionId))
          .get()
      : undefined;
    const machineId = production?.machineId ?? asset.machineId;
    const impactLabel =
      impact === "rework"
        ? "再実装あり"
        : impact === "swap"
          ? "差し替えのみ"
          : "影響度未確定";

    pushActivity(tx, {
      type: "asset_received_final",
      actorId: me.id,
      machineId,
      productionId: production?.id,
      assetId: asset.id,
      message: `本データ受領: 「${asset.name}」(${impactLabel})${note ? ` — ${note}` : ""}`,
    });
    if (reopenedTypes.length > 0 && production) {
      const labels = reopenedTypes.map((t) => PHASE_LABEL[t]).join(" / ");
      pushActivity(tx, {
        type: "phase_updated",
        actorId: me.id,
        machineId,
        productionId: production.id,
        message: `本データ「${asset.name}」受領により、${labels} を実装中に戻しました`,
      });
    }
  });

  revalidatePath("/", "layout");
}

export async function markAssetReworkDone(id: string) {
  const me = await requireUser();

  db.transaction((tx) => {
    const asset = tx
      .select()
      .from(schema.assets)
      .where(eq(schema.assets.id, id))
      .get();
    if (!asset) return;

    const now = nowIso();
    tx.update(schema.assets)
      .set({
        reworkRequired: false,
        reworkDoneAt: now,
        updatedAt: now,
      })
      .where(eq(schema.assets.id, id))
      .run();

    const production = asset.productionId
      ? tx
          .select()
          .from(schema.productions)
          .where(eq(schema.productions.id, asset.productionId))
          .get()
      : undefined;
    const machineId = production?.machineId ?? asset.machineId;

    pushActivity(tx, {
      type: "asset_rework_done",
      actorId: me.id,
      machineId,
      productionId: production?.id,
      assetId: asset.id,
      message: `「${asset.name}」の再実装を完了しました`,
    });
  });

  revalidatePath("/", "layout");
}
