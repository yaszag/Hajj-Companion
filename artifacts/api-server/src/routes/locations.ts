import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, locationHistoryTable, usersTable } from "@workspace/db";
import { SyncLocationsBody, GetGroupLiveLocationsParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router = Router();

router.post("/locations/sync", requireAuth, async (req, res): Promise<void> => {
  const parsed = SyncLocationsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { locations } = parsed.data;
  if (locations.length === 0) {
    res.json({ synced: 0, message: "لا توجد نقاط للمزامنة" });
    return;
  }

  const rows = locations.map((loc) => ({
    userId: req.userId!,
    latitude: loc.latitude,
    longitude: loc.longitude,
    accuracy: loc.accuracy ?? null,
    zone: loc.zone ?? null,
    isOfflineSync: loc.isOfflineSync ?? false,
    recordedAt: new Date(loc.recordedAt),
  }));

  await db.insert(locationHistoryTable).values(rows);
  res.json({ synced: rows.length, message: "تمت المزامنة بنجاح" });
});

router.get("/locations/group/:groupId/live", requireAuth, async (req, res): Promise<void> => {
  const params = GetGroupLiveLocationsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const members = await db.select({
    id: usersTable.id,
    fullNameAr: usersTable.fullNameAr,
  }).from(usersTable).where(eq(usersTable.groupId, params.data.groupId));

  const liveLocations = await Promise.all(
    members.map(async (m) => {
      const [loc] = await db
        .select()
        .from(locationHistoryTable)
        .where(eq(locationHistoryTable.userId, m.id))
        .orderBy(desc(locationHistoryTable.recordedAt))
        .limit(1);
      if (!loc) return null;
      return {
        userId: m.id,
        fullNameAr: m.fullNameAr,
        latitude: loc.latitude,
        longitude: loc.longitude,
        zone: loc.zone,
        recordedAt: loc.recordedAt.toISOString(),
      };
    })
  );

  res.json(liveLocations.filter(Boolean));
});

export default router;
