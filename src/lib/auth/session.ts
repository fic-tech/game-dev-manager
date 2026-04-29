import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "../db/client";

const SESSION_COOKIE = "redmine_session";
const SESSION_DAYS = 30;

export type SessionUser = Omit<
  typeof schema.users.$inferSelect,
  "passwordHash"
>;

export async function createSession(userId: string): Promise<string> {
  const id = nanoid(32);
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  db.insert(schema.sessions)
    .values({
      id,
      userId,
      expiresAt: expires.toISOString(),
      createdAt: now.toISOString(),
    })
    .run();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });

  return id;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId)).run();
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * 現在のセッションを取得 (Server Components / Server Actions 共用)。
 * cache() で同一リクエスト内のリクエスト多重化を防ぐ。
 */
export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const row = db
    .select({
      sessionId: schema.sessions.id,
      expiresAt: schema.sessions.expiresAt,
      user: schema.users,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(eq(schema.sessions.id, sessionId))
    .get();

  if (!row) return null;

  if (new Date(row.expiresAt).getTime() < Date.now()) {
    db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId)).run();
    return null;
  }

  // パスワードハッシュは返さない
  const { passwordHash: _ph, ...safeUser } = row.user;
  return { user: safeUser };
});

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/** Server Action / Server Component 内でログイン必須を強制 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
