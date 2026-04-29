import "server-only";

import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "redmine.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

declare global {
  var __redmine_sqlite__: Database.Database | undefined;
}

const sqlite =
  globalThis.__redmine_sqlite__ ?? new Database(DB_PATH);

if (!globalThis.__redmine_sqlite__) {
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("synchronous = NORMAL");
  globalThis.__redmine_sqlite__ = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { schema };
export type Db = typeof db;
