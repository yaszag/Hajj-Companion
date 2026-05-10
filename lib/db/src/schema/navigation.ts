import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { personalPlacesTable } from "./places";

export const navigationSessionsTable = pgTable(
  "navigation_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    destinationPlaceId: uuid("destination_place_id").references(
      () => personalPlacesTable.id,
      { onDelete: "set null" }
    ),
    destinationLat: doublePrecision("destination_lat").notNull(),
    destinationLng: doublePrecision("destination_lng").notNull(),
    destinationName: varchar("destination_name", { length: 100 }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    distanceTotalM: doublePrecision("distance_total_m"),
    distanceWalkedM: doublePrecision("distance_walked_m").default(0),
  },
  (table) => [
    index("idx_nav_user_started").on(table.userId, table.startedAt),
  ]
);

export const insertNavigationSessionSchema = createInsertSchema(navigationSessionsTable).omit({
  id: true,
  startedAt: true,
  completedAt: true,
  cancelledAt: true,
  distanceWalkedM: true,
});
export type InsertNavigationSession = z.infer<typeof insertNavigationSessionSchema>;
export type NavigationSession = typeof navigationSessionsTable.$inferSelect;
