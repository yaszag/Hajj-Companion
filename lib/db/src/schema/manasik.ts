import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const manasikProgressTable = pgTable(
  "manasik_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    mansakKey: varchar("mansak_key", { length: 30 }).notNull(),
    status: varchar("status", { length: 15 }).default("pending").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    unique("uniq_user_mansak").on(table.userId, table.mansakKey),
  ]
);

export const insertManasikProgressSchema = createInsertSchema(manasikProgressTable).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});
export type InsertManasikProgress = z.infer<typeof insertManasikProgressSchema>;
export type ManasikProgress = typeof manasikProgressTable.$inferSelect;

// Static manasik data (no DB needed for definitions)
export const MANASIK_LIST = [
  { key: "ihram",            titleAr: "الإحرام",                   titleEn: "Ihram",                   order: 1,  day: 8,  descriptionAr: "ارتداء ملابس الإحرام والنية للحج" },
  { key: "tawaf_qudum",     titleAr: "طواف القدوم",                titleEn: "Tawaf al-Qudum",           order: 2,  day: 8,  descriptionAr: "الطواف الترحيبي حول الكعبة المشرفة" },
  { key: "sai",              titleAr: "السعي بين الصفا والمروة",    titleEn: "Sa'i",                    order: 3,  day: 8,  descriptionAr: "السعي سبعة أشواط بين جبلي الصفا والمروة" },
  { key: "mina_day8",        titleAr: "المبيت في منى (يوم التروية)", titleEn: "Stay in Mina (Day 8)",   order: 4,  day: 8,  descriptionAr: "المبيت في منى ليلة التاسع من ذي الحجة" },
  { key: "wuquf_arafah",    titleAr: "الوقوف بعرفة",               titleEn: "Wuquf in Arafah",         order: 5,  day: 9,  descriptionAr: "الركن الأعظم — الوقوف بجبل عرفات بعد الزوال" },
  { key: "muzdalifah",       titleAr: "المبيت في مزدلفة",           titleEn: "Stay in Muzdalifah",      order: 6,  day: 9,  descriptionAr: "الانتقال إلى مزدلفة والمبيت فيها وجمع الحصى" },
  { key: "rami_aqaba",       titleAr: "رمي جمرة العقبة",            titleEn: "Rami al-Aqaba",           order: 7,  day: 10, descriptionAr: "رمي جمرة العقبة الكبرى بسبع حصيات" },
  { key: "nahr",             titleAr: "النحر (الهدي)",              titleEn: "Nahr (Sacrifice)",        order: 8,  day: 10, descriptionAr: "ذبح الهدي شكراً لله تعالى" },
  { key: "taqsir",           titleAr: "الحلق أو التقصير",           titleEn: "Halq / Taqsir",           order: 9,  day: 10, descriptionAr: "حلق الرأس أو تقصير الشعر والتحلل من الإحرام" },
  { key: "tawaf_ifadah",    titleAr: "طواف الإفاضة",               titleEn: "Tawaf al-Ifadah",         order: 10, day: 10, descriptionAr: "الطواف الركن — الطواف بالكعبة يوم العيد" },
  { key: "sai_ifadah",      titleAr: "السعي بعد طواف الإفاضة",     titleEn: "Sa'i (after Ifadah)",     order: 11, day: 10, descriptionAr: "السعي بين الصفا والمروة بعد طواف الإفاضة" },
  { key: "mina_ayam_tashriq", titleAr: "المبيت في منى أيام التشريق", titleEn: "Mina (Days of Tashriq)", order: 12, day: 11, descriptionAr: "المبيت في منى ليالي الحادي عشر والثاني عشر" },
  { key: "rami_tashriq",    titleAr: "رمي الجمرات الثلاث",         titleEn: "Rami (Three Jamarat)",    order: 13, day: 11, descriptionAr: "رمي الجمرات الثلاث في أيام التشريق" },
  { key: "tawaf_wada",      titleAr: "طواف الوداع",                titleEn: "Tawaf al-Wada",           order: 14, day: 13, descriptionAr: "آخر عهد الحاج بالبيت الحرام قبل المغادرة" },
];
