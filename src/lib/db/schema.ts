import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Families table
export const families = sqliteTable("families", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Users table (extends Clerk user data)
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  familyId: text("family_id").references(() => families.id),
  role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Events table
export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id),
  title: text("title").notNull(),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }),
  allDay: integer("all_day", { mode: "boolean" }).notNull().default(true),
  color: text("color").notNull().default("#7C9A7E"),
  notes: text("notes"),
  recurrence: text("recurrence", { enum: ["none", "daily", "weekly", "monthly", "yearly"] }).notNull().default("none"),
  excludedDates: text("excluded_dates", { mode: "json" }), // JSON array of ISO date strings to skip for recurring events
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  updatedBy: text("updated_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Relations
export const familiesRelations = relations(families, ({ many }) => ({
  users: many(users),
  events: many(events),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  family: one(families, {
    fields: [users.familyId],
    references: [families.id],
  }),
  createdEvents: many(events),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  family: one(families, {
    fields: [events.familyId],
    references: [families.id],
  }),
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  updater: one(users, {
    fields: [events.updatedBy],
    references: [users.id],
  }),
}));

// Types
export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;