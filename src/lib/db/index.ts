import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

declare global {
  var _dbClient: ReturnType<typeof postgres> | undefined;
}

// Reuse connection across hot reloads in dev, single pool in prod
const client = globalThis._dbClient ?? postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

if (process.env.NODE_ENV === "development") {
  globalThis._dbClient = client;
}

export const db = drizzle(client, { schema });
