import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const arafahPlansTable = pgTable("arafah_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  totalDhikrCount: integer("total_dhikr_count").default(0).notNull(),
  totalDuasRead: integer("total_duas_read").default(0).notNull(),
  goalsCompleted: integer("goals_completed").default(0).notNull(),
  reflection: text("reflection"),
});

export const arafahTimeBlocksTable = pgTable("arafah_time_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").notNull().references(() => arafahPlansTable.id, { onDelete: "cascade" }),
  labelAr: varchar("label_ar", { length: 100 }).notNull(),
  labelEn: varchar("label_en", { length: 100 }),
  startTime: varchar("start_time", { length: 5 }).notNull(),
  endTime: varchar("end_time", { length: 5 }).notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
  moodColor: varchar("mood_color", { length: 7 }),
});

export const arafahGoalTypeEnum = z.enum(["dhikr", "tasbeeh", "dua_read", "quran", "salawat", "custom"]);
export const arafahTargetTypeEnum = z.enum(["count", "boolean"]);

export const arafahGoalsTable = pgTable("arafah_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").notNull().references(() => arafahPlansTable.id, { onDelete: "cascade" }),
  blockId: uuid("block_id").references(() => arafahTimeBlocksTable.id, { onDelete: "set null" }),
  goalType: varchar("goal_type", { length: 20 }).notNull(),
  targetType: varchar("target_type", { length: 20 }).notNull().default("count"),
  targetValue: integer("target_value").default(1).notNull(),
  refType: varchar("ref_type", { length: 30 }),
  refId: uuid("ref_id"),
  titleAr: varchar("title_ar", { length: 200 }),
  arabicText: text("arabic_text"),
  orderIndex: integer("order_index").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  currentCount: integer("current_count").default(0).notNull(),
});

export const arafahDuaProgressTable = pgTable("arafah_dua_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").notNull().references(() => arafahPlansTable.id, { onDelete: "cascade" }),
  duaId: uuid("dua_id").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("not_started"),
  lastPosition: integer("last_position"),
  readCount: integer("read_count").default(0).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const arafahSessionStatesTable = pgTable("arafah_session_states", {
  userId: uuid("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  planId: uuid("plan_id").notNull().references(() => arafahPlansTable.id, { onDelete: "cascade" }),
  activeScreen: varchar("active_screen", { length: 30 }),
  activeGoalId: uuid("active_goal_id"),
  activeTasbeehPresetId: uuid("active_tasbeeh_preset_id"),
  activeDuaId: uuid("active_dua_id"),
  activeDuaPosition: integer("active_dua_position"),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArafahPlanSchema = createInsertSchema(arafahPlansTable).omit({ id: true, startedAt: true });
export const insertArafahGoalSchema = createInsertSchema(arafahGoalsTable).omit({ id: true, completedAt: true });

export type ArafahPlan = typeof arafahPlansTable.$inferSelect;
export type ArafahGoal = typeof arafahGoalsTable.$inferSelect;
export type ArafahTimeBlock = typeof arafahTimeBlocksTable.$inferSelect;
export type ArafahDuaProgress = typeof arafahDuaProgressTable.$inferSelect;
export type InsertArafahPlan = z.infer<typeof insertArafahPlanSchema>;
export type InsertArafahGoal = z.infer<typeof insertArafahGoalSchema>;
