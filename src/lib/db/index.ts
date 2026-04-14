import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Use Supabase pooler-optimized settings
// max: 10 connections is plenty for a family app
// idle_timeout: close idle connections after 20s to free resources
// connect_timeout: fail fast if Supabase is unreachable
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });