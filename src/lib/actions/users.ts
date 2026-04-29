"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "../db/client";
import { requireUser } from "../auth/session";
import { hashPassword } from "../auth/password";
import { nowIso } from "./_helpers";
import type { User } from "../types";

export type CreateUserInput = Omit<User, "id" | "avatarHue"> & {
  avatarHue?: number;
  password?: string;
};

export async function createUser(input: CreateUserInput) {
  await requireUser();
  const id = `u-${nanoid(6)}`;

  const existingHues = db
    .select({ avatarHue: schema.users.avatarHue })
    .from(schema.users)
    .all()
    .map((u) => u.avatarHue);

  const autoHue =
    input.avatarHue ??
    ((existingHues.length * 47 + Math.floor(Math.random() * 30)) % 360);

  const passwordHash = await hashPassword(input.password ?? "password");

  db.insert(schema.users)
    .values({
      id,
      name: input.name,
      email: input.email.trim().toLowerCase(),
      passwordHash,
      avatarHue: autoHue,
      role: input.role,
      discipline: input.discipline,
      createdAt: nowIso(),
    })
    .run();

  revalidatePath("/", "layout");
  return { id, avatarHue: autoHue };
}

export async function updateUser(id: string, patch: Partial<User>) {
  await requireUser();

  db.update(schema.users)
    .set({
      name: patch.name,
      email: patch.email?.trim().toLowerCase(),
      avatarHue: patch.avatarHue,
      role: patch.role,
      discipline: patch.discipline,
    })
    .where(eq(schema.users.id, id))
    .run();

  revalidatePath("/", "layout");
}
