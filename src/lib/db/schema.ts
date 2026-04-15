import { pgTable, text, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Families table
export const families = pgTable("families", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Users table (extends Clerk user data)
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  familyId: text("family_id").references(() => families.id),
  role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_users_family_id").on(table.familyId),
]);

// Invitations table (for email-based invitations)
export const invitations = pgTable("invitations", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  invitedBy: text("invited_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["pending", "accepted", "declined", "expired"] })
    .notNull()
    .default("pending"),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_invitations_family_id").on(table.familyId),
  index("idx_invitations_email").on(table.email),
  index("idx_invitations_token").on(table.token),
  index("idx_invitations_status").on(table.status),
]);

// Events table
export const events = pgTable("events", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id),
  title: text("title").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  allDay: boolean("all_day").notNull().default(true),
  notes: text("notes"),
  recurrence: text("recurrence", { enum: ["none", "daily", "weekly", "biweekly", "triweekly", "monthly", "yearly"] }).notNull().default("none"),
  excludedDates: jsonb("excluded_dates").$type<string[] | null>(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  updatedBy: text("updated_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_events_family_id").on(table.familyId),
  index("idx_events_start_date").on(table.startDate),
  index("idx_events_created_by").on(table.createdBy),
]);

// Relations
export const familiesRelations = relations(families, ({ many }) => ({
  users: many(users),
  events: many(events),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  family: one(families, {
    fields: [users.familyId],
    references: [families.id],
  }),
  createdEvents: many(events),
  sentInvitations: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  family: one(families, {
    fields: [invitations.familyId],
    references: [families.id],
  }),
  inviter: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
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
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;