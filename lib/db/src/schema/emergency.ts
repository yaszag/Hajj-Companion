import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const emergencyAlertsTable = pgTable("emergency_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  alertType: varchar("alert_type", { length: 20 }).default("sos").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  status: varchar("status", { length: 15 }).default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlertsTable).omit({
  id: true,
  status: true,
  createdAt: true,
  resolvedAt: true,
});
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
export type EmergencyAlert = typeof emergencyAlertsTable.$inferSelect;
