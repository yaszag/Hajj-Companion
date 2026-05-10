import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  doublePrecision,
  real,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const locationHistoryTable = pgTable(
  "location_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    accuracy: real("accuracy"),
    zone: varchar("zone", { length: 30 }),
    isOfflineSync: boolean("is_offline_sync").default(false).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_location_user_time").on(table.userId, table.recordedAt),
  ]
);

export const insertLocationSchema = createInsertSchema(locationHistoryTable).omit({
  id: true,
  syncedAt: true,
});
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type LocationHistory = typeof locationHistoryTable.$inferSelect;
