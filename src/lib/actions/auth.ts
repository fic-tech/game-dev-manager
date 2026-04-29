"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/client";
import { verifyPassword, hashPassword } from "../auth/password";
import {
  createSession,
  destroySession,
  requireUser,
} from "../auth/session";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .get();

  if (!user) {
    return { error: "メールアドレスまたはパスワードが違います。" };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "メールアドレスまたはパスワードが違います。" };
  }

  await createSession(user.id);

  // next が外部URLにならないように先頭 / のパスのみ許可
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/";
  redirect(safeNext);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export type ChangePasswordState = {
  error?: string;
  success?: boolean;
};

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const me = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next || !confirm) {
    return { error: "すべての項目を入力してください。" };
  }
  if (next !== confirm) {
    return { error: "新しいパスワードが一致しません。" };
  }
  if (next.length < 4) {
    return { error: "新しいパスワードは4文字以上にしてください。" };
  }

  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, me.id))
    .get();
  if (!user) return { error: "ユーザーが見つかりません。" };

  const ok = await verifyPassword(current, user.passwordHash);
  if (!ok) return { error: "現在のパスワードが違います。" };

  const newHash = await hashPassword(next);
  db.update(schema.users)
    .set({ passwordHash: newHash })
    .where(eq(schema.users.id, me.id))
    .run();

  return { success: true };
}
