import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, navigationSessionsTable, personalPlacesTable } from "@workspace/db";
import {
  StartNavigationBody,
  UpdateNavigationParams,
  UpdateNavigationBody,
  CompleteNavigationParams,
  CancelNavigationParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import {
  haversineDistance,
  calculateBearing,
  bearingToArabic,
  etaMinutes,
} from "../lib/geo";

const router = Router();

router.post("/navigation/start", requireAuth, async (req, res): Promise<void> => {
  const parsed = StartNavigationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { placeId, destinationLat, destinationLng, destinationName } = parsed.data;

  // Get place emoji if place_id provided
  let emoji: string | null = null;
  if (placeId) {
    const [place] = await db
      .select({ emoji: personalPlacesTable.emoji })
      .from(personalPlacesTable)
      .where(
        and(eq(personalPlacesTable.id, placeId), eq(personalPlacesTable.userId, req.userId!))
      )
      .limit(1);
    if (place) emoji = place.emoji;

    // Increment visit count
    await db
      .update(personalPlacesTable)
      .set({ visitCount: personalPlacesTable.visitCount, lastVisitedAt: new Date() })
      .where(eq(personalPlacesTable.id, placeId));
  }

  const [session] = await db
    .insert(navigationSessionsTable)
    .values({
      userId: req.userId!,
      destinationPlaceId: placeId ?? null,
      destinationLat,
      destinationLng,
      destinationName,
    })
    .returning();

  // We'll use a dummy current position — real bearing comes from client
  const bearing = 0; // client calculates from real position
  const distanceM = 0; // client calculates

  res.status(201).json({
    sessionId: session.id,
    destination: {
      lat: destinationLat,
      lng: destinationLng,
      name: destinationName,
      emoji,
    },
    distanceM,
    bearingDegrees: bearing,
    directionAr: bearingToArabic(bearing),
    etaMinutes: etaMinutes(distanceM),
  });
});

router.get("/navigation/history", requireAuth, async (req, res): Promise<void> => {
  const sessions = await db
    .select()
    .from(navigationSessionsTable)
    .where(eq(navigationSessionsTable.userId, req.userId!))
    .orderBy(navigationSessionsTable.startedAt)
    .limit(50);

  const formatStatus = (s: typeof navigationSessionsTable.$inferSelect) => {
    if (s.completedAt) return "completed";
    if (s.cancelledAt) return "cancelled";
    return "active";
  };

  res.json(
    sessions.map((s) => ({
      id: s.id,
      destinationName: s.destinationName,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt?.toISOString() ?? null,
      cancelledAt: s.cancelledAt?.toISOString() ?? null,
      distanceTotalM: s.distanceTotalM,
      distanceWalkedM: s.distanceWalkedM,
      status: formatStatus(s),
    }))
  );
});

router.post("/navigation/:sessionId/update", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateNavigationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateNavigationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [session] = await db
    .select()
    .from(navigationSessionsTable)
    .where(
      and(
        eq(navigationSessionsTable.id, params.data.sessionId),
        eq(navigationSessionsTable.userId, req.userId!)
      )
    )
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "الجلسة غير موجودة" });
    return;
  }

  const { currentLat, currentLng } = body.data;
  const distanceM = haversineDistance(
    currentLat, currentLng,
    session.destinationLat, session.destinationLng
  );
  const bearing = calculateBearing(
    currentLat, currentLng,
    session.destinationLat, session.destinationLng
  );
  const isArrived = distanceM < 30;

  // Update walked distance
  if (session.distanceTotalM == null) {
    await db
      .update(navigationSessionsTable)
      .set({ distanceTotalM: distanceM })
      .where(eq(navigationSessionsTable.id, session.id));
  }

  res.json({
    distanceRemainingM: Math.round(distanceM),
    bearingDegrees: Math.round(bearing * 10) / 10,
    directionAr: bearingToArabic(bearing),
    etaMinutes: etaMinutes(distanceM),
    isArrived,
  });
});

router.post("/navigation/:sessionId/complete", requireAuth, async (req, res): Promise<void> => {
  const params = CompleteNavigationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db
    .update(navigationSessionsTable)
    .set({ completedAt: new Date() })
    .where(
      and(
        eq(navigationSessionsTable.id, params.data.sessionId),
        eq(navigationSessionsTable.userId, req.userId!)
      )
    )
    .returning();

  if (!session) {
    res.status(404).json({ error: "الجلسة غير موجودة" });
    return;
  }

  const durationMs = session.completedAt!.getTime() - session.startedAt.getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  res.json({
    walkedM: session.distanceWalkedM ?? session.distanceTotalM ?? 0,
    durationMinutes,
    messageAr: `وصلت إلى ${session.destinationName}! 🎉`,
  });
});

router.post("/navigation/:sessionId/cancel", requireAuth, async (req, res): Promise<void> => {
  const params = CancelNavigationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db
    .update(navigationSessionsTable)
    .set({ cancelledAt: new Date() })
    .where(
      and(
        eq(navigationSessionsTable.id, params.data.sessionId),
        eq(navigationSessionsTable.userId, req.userId!)
      )
    )
    .returning();

  if (!session) {
    res.status(404).json({ error: "الجلسة غير موجودة" });
    return;
  }

  res.json({ success: true, message: "تم إلغاء الملاحة" });
});

export default router;
