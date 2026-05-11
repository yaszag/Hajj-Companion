import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const groupsTable = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  agency: varchar("agency", { length: 100 }),
  leaderId: uuid("leader_id"),
  inviteCode: varchar("invite_code", { length: 6 }).unique().notNull(),
  maxMembers: integer("max_members").default(50).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGroupSchema = createInsertSchema(groupsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groupsTable.$inferSelect;
