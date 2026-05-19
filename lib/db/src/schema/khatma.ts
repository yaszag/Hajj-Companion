import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const khatmaStatusEnum = pgEnum("khatma_status", ["active", "completed", "paused"]);

export const quranSurahsTable = pgTable("quran_surahs", {
  id: integer("id").primaryKey(),
  nameAr: varchar("name_ar", { length: 50 }).notNull(),
  nameEn: varchar("name_en", { length: 50 }).notNull(),
  ayatCount: integer("ayat_count").notNull(),
  revelationType: varchar("revelation_type", { length: 10 }).notNull(),
  juzStart: integer("juz_start").notNull(),
});

export const quranJuzTable = pgTable("quran_juz", {
  juzNumber: integer("juz_number").primaryKey(),
  startSurahId: integer("start_surah_id").notNull(),
  startAyah: integer("start_ayah").notNull(),
  endSurahId: integer("end_surah_id").notNull(),
  endAyah: integer("end_ayah").notNull(),
  totalAyat: integer("total_ayat").notNull(),
});

export const khatmaPlansTable = pgTable("khatma_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull().default("ختمة القرآن"),
  status: khatmaStatusEnum("status").notNull().default("active"),
  totalAyat: integer("total_ayat").notNull().default(6236),
  targetDays: integer("target_days").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull().defaultNow(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  currentSurahId: integer("current_surah_id").notNull().default(1),
  currentAyah: integer("current_ayah").notNull().default(1),
  totalAyatRead: integer("total_ayat_read").notNull().default(0),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  idxUserStatus: index("idx_khatma_user_status").on(t.userId, t.status),
}));

export const khatmaDailyLogsTable = pgTable("khatma_daily_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => khatmaPlansTable.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(),
  ayatRead: integer("ayat_read").notNull(),
  startSurahId: integer("start_surah_id").notNull(),
  startAyah: integer("start_ayah").notNull(),
  endSurahId: integer("end_surah_id").notNull(),
  endAyah: integer("end_ayah").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  idxPlanDate: index("idx_khatma_log_plan_date").on(t.planId, t.date),
}));

export const insertQuranSurahSchema = createInsertSchema(quranSurahsTable);
export const insertQuranJuzSchema = createInsertSchema(quranJuzTable);
export const insertKhatmaPlanSchema = createInsertSchema(khatmaPlansTable).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export const insertKhatmaDailyLogSchema = createInsertSchema(khatmaDailyLogsTable).omit({
  id: true,
  createdAt: true,
});

export type QuranSurah = typeof quranSurahsTable.$inferSelect;
export type QuranJuz = typeof quranJuzTable.$inferSelect;
export type KhatmaPlan = typeof khatmaPlansTable.$inferSelect;
export type InsertKhatmaPlan = z.infer<typeof insertKhatmaPlanSchema>;
export type KhatmaDailyLog = typeof khatmaDailyLogsTable.$inferSelect;
export type InsertKhatmaDailyLog = z.infer<typeof insertKhatmaDailyLogSchema>;
