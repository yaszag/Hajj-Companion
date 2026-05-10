import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const duaCategoriesTable = pgTable("dua_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
  descriptionAr: text("description_ar"),
  orderIndex: integer("order_index").default(0).notNull(),
  duasCount: integer("duas_count").default(0).notNull(),
});

export const duasTable = pgTable("duas", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleAr: varchar("title_ar", { length: 200 }).notNull(),
  titleEn: varchar("title_en", { length: 200 }),
  arabicText: text("arabic_text").notNull(),
  transliteration: text("transliteration"),
  translationAr: text("translation_ar"),
  translationFr: text("translation_fr"),
  translationEn: text("translation_en"),
  categoryId: uuid("category_id").references(() => duaCategoriesTable.id, { onDelete: "set null" }),
  duaType: varchar("dua_type", { length: 20 }).default("short").notNull(),
  source: varchar("source", { length: 200 }),
  mansakKey: varchar("mansak_key", { length: 30 }),
  isFeatured: boolean("is_featured").default(false).notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userDuaFavoritesTable = pgTable(
  "user_dua_favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    duaId: uuid("dua_id").notNull().references(() => duasTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("uniq_user_dua_fav").on(table.userId, table.duaId)]
);

export const insertDuaCategorySchema = createInsertSchema(duaCategoriesTable).omit({ id: true });
export const insertDuaSchema = createInsertSchema(duasTable).omit({ id: true, createdAt: true });

export type DuaCategory = typeof duaCategoriesTable.$inferSelect;
export type Dua = typeof duasTable.$inferSelect;
export type InsertDua = z.infer<typeof insertDuaSchema>;
export type InsertDuaCategory = z.infer<typeof insertDuaCategorySchema>;
