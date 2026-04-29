"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "../db/client";
import { requireUser } from "../auth/session";
import type { Machine } from "../types";
import { nowIso, pushActivity } from "./_helpers";

export type CreateMachineInput = Omit<
  Machine,
  "id" | "createdAt" | "memberIds"
> & {
  memberIds?: string[];
};

export async function createMachine(input: CreateMachineInput) {
  const me = await requireUser();
  const id = `m-${nanoid(6)}`;
  const createdAt = nowIso();
  const memberIds = input.memberIds ?? [me.id];

  db.transaction((tx) => {
    tx.insert(schema.machines)
      .values({
        id,
        code: input.code,
        name: input.name,
        series: input.series,
        description: input.description,
        color: input.color,
        releaseTarget: input.releaseTarget,
        createdAt,
      })
      .run();

    for (const userId of memberIds) {
      tx.insert(schema.machineMembers)
        .values({ machineId: id, userId })
        .run();
    }

    pushActivity(tx, {
      type: "machine_created",
      actorId: me.id,
      machineId: id,
      message: `機種「${input.name}」を登録しました`,
    });
  });

  revalidatePath("/", "layout");
  return { id };
}

export async function updateMachine(id: string, patch: Partial<Machine>) {
  await requireUser();

  db.update(schema.machines)
    .set({
      code: patch.code,
      name: patch.name,
      series: patch.series,
      description: patch.description,
      color: patch.color,
      releaseTarget: patch.releaseTarget,
    })
    .where(eq(schema.machines.id, id))
    .run();

  revalidatePath("/", "layout");
}

export async function addMachineMember(machineId: string, userId: string) {
  const me = await requireUser();

  db.transaction((tx) => {
    const existing = tx
      .select()
      .from(schema.machineMembers)
      .where(
        and(
          eq(schema.machineMembers.machineId, machineId),
          eq(schema.machineMembers.userId, userId)
        )
      )
      .get();
    if (existing) return;

    tx.insert(schema.machineMembers).values({ machineId, userId }).run();

    const machine = tx
      .select()
      .from(schema.machines)
      .where(eq(schema.machines.id, machineId))
      .get();
    const user = tx
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .get();

    if (machine) {
      pushActivity(tx, {
        type: "member_assigned",
        actorId: me.id,
        machineId,
        message: `「${user?.name ?? "メンバー"}」を機種「${machine.name}」にアサインしました`,
      });
    }
  });

  revalidatePath("/", "layout");
}

export async function removeMachineMember(machineId: string, userId: string) {
  await requireUser();

  db.delete(schema.machineMembers)
    .where(
      and(
        eq(schema.machineMembers.machineId, machineId),
        eq(schema.machineMembers.userId, userId)
      )
    )
    .run();

  revalidatePath("/", "layout");
}
