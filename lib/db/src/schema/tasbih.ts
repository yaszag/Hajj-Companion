import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const tasbihStatusEnum = pgEnum("tasbih_status", ["active", "completed", "paused"]);

export const tasbihPresetsTable = pgTable("tasbih_presets", {
  id: uuid("id").primaryKey().defaultRandom(),
  phraseAr: varchar("phrase_ar", { length: 200 }).notNull(),
  transliteration: varchar("transliteration", { length: 200 }),
  translationAr: text("translation_ar"),
  meaning: text("meaning"),
  recommendedCount: integer("recommended_count").notNull(),
  category: varchar("category", { length: 30 }).notNull(),
  timeOfDay: varchar("time_of_day", { length: 20 }),
  spiritualNote: text("spiritual_note"),
  orderIndex: integer("order_index").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
});

export const userTasbihSessionsTable = pgTable("user_tasbih_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  presetId: uuid("preset_id")
    .notNull()
    .references(() => tasbihPresetsTable.id, { onDelete: "cascade" }),
  targetCount: integer("target_count").notNull(),
  currentCount: integer("current_count").notNull().default(0),
  roundsCompleted: integer("rounds_completed").notNull().default(0),
  totalCount: integer("total_count").notNull().default(0),
  status: tasbihStatusEnum("status").notNull().default("active"),
  date: varchar("date", { length: 10 }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => ({
  idxUserDate: index("idx_tasbih_user_date").on(t.userId, t.date),
}));

export const insertTasbihPresetSchema = createInsertSchema(tasbihPresetsTable).omit({
  id: true,
  orderIndex: true,
});
export const insertUserTasbihSessionSchema = createInsertSchema(userTasbihSessionsTable).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export type TasbihPreset = typeof tasbihPresetsTable.$inferSelect;
export type InsertTasbihPreset = z.infer<typeof insertTasbihPresetSchema>;
export type UserTasbihSession = typeof userTasbihSessionsTable.$inferSelect;
export type InsertUserTasbihSession = z.infer<typeof insertUserTasbihSessionSchema>;
