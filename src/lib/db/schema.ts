import { pgTable, text, timestamp, boolean, jsonb, index, varchar, numeric, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Families table
export const families = pgTable("families", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  country: text("country"), // ISO 3166-1 alpha-2 code (e.g., "US", "GB")
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
  startTime: varchar("start_time", { length: 5 }),
  endTime: varchar("end_time", { length: 5 }),
  recurrenceEndDate: timestamp("recurrence_end_date", { withTimezone: true }),
  notes: text("notes"),
  recurrence: text("recurrence", { enum: ["none", "daily", "weekly", "biweekly", "triweekly", "quadweekly", "monthly", "yearly"] }).notNull().default("none"),
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

// ============ EXPENSES & BUDGET ============

// Categories (expense categories with optional budgets)
export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: varchar("color", { length: 7 }),
  icon: varchar("icon", { length: 50 }),
  budgetAmount: numeric("budget_amount"),
  budgetPeriod: varchar("budget_period", { length: 20 }).default("monthly"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_categories_family_id").on(table.familyId),
]);

// Expenses (outgoing costs)
export const expenses = pgTable("expenses", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  categoryId: text("category_id").references(() => categories.id),
  amount: numeric("amount").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  period: varchar("period", { enum: ["one-time", "weekly", "monthly", "yearly"] }).default("monthly"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_expenses_family_id").on(table.familyId),
  index("idx_expenses_user_id").on(table.userId),
  index("idx_expenses_category_id").on(table.categoryId),
  index("idx_expenses_date").on(table.date),
]);

// Income (incoming money)
export const income = pgTable("income", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  source: text("source").notNull(),
  amount: numeric("amount").notNull(),
  date: date("date").notNull(),
  period: varchar("period", { enum: ["one-time", "weekly", "monthly", "yearly"] }).default("monthly"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_income_family_id").on(table.familyId),
  index("idx_income_user_id").on(table.userId),
  index("idx_income_date").on(table.date),
]);

// Allocations (how leftover is allocated per period)
export const allocations = pgTable("allocations", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull(),
  period: varchar("period", { length: 7 }).notNull(), // "2026-05" format
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_allocations_family_id").on(table.familyId),
  index("idx_allocations_period").on(table.familyId, table.period),
]);

// Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  family: one(families, {
    fields: [categories.familyId],
    references: [families.id],
  }),
  expenses: many(expenses),
  allocations: many(allocations),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  family: one(families, {
    fields: [expenses.familyId],
    references: [families.id],
  }),
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
}));

export const incomeRelations = relations(income, ({ one }) => ({
  family: one(families, {
    fields: [income.familyId],
    references: [families.id],
  }),
  user: one(users, {
    fields: [income.userId],
    references: [users.id],
  }),
}));

export const allocationsRelations = relations(allocations, ({ one }) => ({
  family: one(families, {
    fields: [allocations.familyId],
    references: [families.id],
  }),
  category: one(categories, {
    fields: [allocations.categoryId],
    references: [categories.id],
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
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type Income = typeof income.$inferSelect;
export type NewIncome = typeof income.$inferInsert;
export type Allocation = typeof allocations.$inferSelect;
export type NewAllocation = typeof allocations.$inferInsert;