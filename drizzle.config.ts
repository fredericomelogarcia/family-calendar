import type { Config } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  // Load .env.local for drizzle-kit CLI commands
  require("dotenv").config({ path: ".env.local" });
}

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;