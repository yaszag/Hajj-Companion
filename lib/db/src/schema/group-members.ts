import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";
import { groupsTable } from "./groups";

export const groupRoleEnum = pgEnum("group_role", ["leader", "member"]);

export const groupMembersTable = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groupsTable.id, { onDelete: "cascade" }),
  role: groupRoleEnum("role").default("member").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueUserGroup: unique("unique_user_group").on(t.userId, t.groupId),
}));

export const insertGroupMemberSchema = createInsertSchema(groupMembersTable).omit({
  id: true,
  joinedAt: true,
});
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupMember = typeof groupMembersTable.$inferSelect;
