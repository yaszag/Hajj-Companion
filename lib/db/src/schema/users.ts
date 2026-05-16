import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { groupsTable } from "./groups";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  passportNo: varchar("passport_no", { length: 20 }).unique().notNull(),
  fullNameAr: varchar("full_name_ar", { length: 100 }).notNull(),
  fullNameEn: varchar("full_name_en", { length: 100 }),
  nationality: varchar("nationality", { length: 2 }).notNull(),
  phone: varchar("phone", { length: 20 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  tentZone: varchar("tent_zone", { length: 200 }),
  groupId: uuid("group_id").references(() => groupsTable.id, { onDelete: "set null" }),
  emergencyContact: varchar("emergency_contact", { length: 20 }),
  nusukType: varchar("nusuk_type", { length: 10 }),
  qrData: jsonb("qr_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
