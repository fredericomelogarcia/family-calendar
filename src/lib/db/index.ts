import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(path.join(dataDir, "kincal.db"));
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Initialize database tables
export function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      invite_code TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      family_id TEXT REFERENCES families(id),
      role TEXT NOT NULL DEFAULT 'member',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id),
      title TEXT NOT NULL,
      start_date INTEGER NOT NULL,
      end_date INTEGER,
      all_day INTEGER NOT NULL DEFAULT 1,
      color TEXT NOT NULL DEFAULT '#7C9A7E',
      notes TEXT,
      recurrence TEXT NOT NULL DEFAULT 'none',
      created_by TEXT NOT NULL REFERENCES users(id),
      updated_by TEXT REFERENCES users(id),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_family ON users(family_id);
    CREATE INDEX IF NOT EXISTS idx_events_family ON events(family_id);
    CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_date);
  `);
}

// Initialize on import
initializeDatabase();