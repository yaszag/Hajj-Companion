import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
  doublePrecision,
  text,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { groupsTable } from "./groups";

export const personalPlacesTable = pgTable(
  "personal_places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    nameAr: varchar("name_ar", { length: 100 }).notNull(),
    nameEn: varchar("name_en", { length: 100 }),
    emoji: varchar("emoji", { length: 10 }).default("📍").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    description: text("description"),
    color: varchar("color", { length: 7 }).default("#1D9E75").notNull(),
    isShared: boolean("is_shared").default(false).notNull(),
    sharedWithGroup: uuid("shared_with_group").references(() => groupsTable.id, {
      onDelete: "set null",
    }),
    visitCount: integer("visit_count").default(0).notNull(),
    lastVisitedAt: timestamp("last_visited_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_personal_places_user").on(table.userId),
    index("idx_personal_places_shared").on(table.sharedWithGroup),
  ]
);

export const insertPlaceSchema = createInsertSchema(personalPlacesTable).omit({
  id: true,
  visitCount: true,
  lastVisitedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type PersonalPlace = typeof personalPlacesTable.$inferSelect;
