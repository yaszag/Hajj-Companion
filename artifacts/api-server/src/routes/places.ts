import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, personalPlacesTable, navigationSessionsTable } from "@workspace/db";
import {
  CreatePlaceBody,
  UpdatePlaceParams,
  UpdatePlaceBody,
  GetPlaceParams,
  DeletePlaceParams,
  GetGroupPlacesParams,
  GetPlacesQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { haversineDistance } from "../lib/geo";

const router = Router();

router.get("/places", requireAuth, async (req, res): Promise<void> => {
  const query = GetPlacesQueryParams.safeParse(req.query);
  const userLat = query.success ? query.data.lat : undefined;
  const userLng = query.success ? query.data.lng : undefined;

  const places = await db
    .select()
    .from(personalPlacesTable)
    .where(eq(personalPlacesTable.userId, req.userId!))
    .orderBy(personalPlacesTable.createdAt);

  const result = places.map((p) => ({
    ...p,
    lastVisitedAt: p.lastVisitedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    distanceFromUserM:
      userLat != null && userLng != null
        ? Math.round(haversineDistance(userLat, userLng, p.latitude, p.longitude))
        : null,
  }));

  // Sort by distance if coordinates given
  if (userLat != null && userLng != null) {
    result.sort((a, b) => (a.distanceFromUserM ?? 0) - (b.distanceFromUserM ?? 0));
  }

  res.json(result);
});

router.post("/places", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreatePlaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [place] = await db
    .insert(personalPlacesTable)
    .values({
      userId: req.userId!,
      nameAr: parsed.data.nameAr,
      nameEn: parsed.data.nameEn ?? null,
      emoji: parsed.data.emoji ?? "📍",
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      description: parsed.data.description ?? null,
      color: parsed.data.color ?? "#1D9E75",
      isShared: parsed.data.isShared ?? false,
      sharedWithGroup: parsed.data.sharedWithGroup ?? null,
    })
    .returning();

  res.status(201).json({
    ...place,
    lastVisitedAt: place.lastVisitedAt?.toISOString() ?? null,
    createdAt: place.createdAt.toISOString(),
    updatedAt: place.updatedAt.toISOString(),
    distanceFromUserM: null,
  });
});

router.get("/places/group/:groupId", requireAuth, async (req, res): Promise<void> => {
  const params = GetGroupPlacesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const places = await db
    .select()
    .from(personalPlacesTable)
    .where(
      and(
        eq(personalPlacesTable.isShared, true),
        eq(personalPlacesTable.sharedWithGroup, params.data.groupId)
      )
    );

  res.json(
    places.map((p) => ({
      ...p,
      lastVisitedAt: p.lastVisitedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      distanceFromUserM: null,
    }))
  );
});

router.get("/places/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetPlaceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [place] = await db
    .select()
    .from(personalPlacesTable)
    .where(
      and(eq(personalPlacesTable.id, params.data.id), eq(personalPlacesTable.userId, req.userId!))
    )
    .limit(1);

  if (!place) {
    res.status(404).json({ error: "الموقع غير موجود" });
    return;
  }

  const navHistory = await db
    .select()
    .from(navigationSessionsTable)
    .where(eq(navigationSessionsTable.destinationPlaceId, place.id))
    .orderBy(navigationSessionsTable.startedAt)
    .limit(10);

  const formatStatus = (s: typeof navigationSessionsTable.$inferSelect) => {
    if (s.completedAt) return "completed";
    if (s.cancelledAt) return "cancelled";
    return "active";
  };

  res.json({
    ...place,
    lastVisitedAt: place.lastVisitedAt?.toISOString() ?? null,
    createdAt: place.createdAt.toISOString(),
    updatedAt: place.updatedAt.toISOString(),
    distanceFromUserM: null,
    navigationHistory: navHistory.map((n) => ({
      id: n.id,
      destinationName: n.destinationName,
      startedAt: n.startedAt.toISOString(),
      completedAt: n.completedAt?.toISOString() ?? null,
      cancelledAt: n.cancelledAt?.toISOString() ?? null,
      distanceTotalM: n.distanceTotalM,
      distanceWalkedM: n.distanceWalkedM,
      status: formatStatus(n),
    })),
  });
});

router.put("/places/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdatePlaceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdatePlaceBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const update: Record<string, unknown> = {};
  if (body.data.nameAr != null) update.nameAr = body.data.nameAr;
  if (body.data.nameEn !== undefined) update.nameEn = body.data.nameEn;
  if (body.data.emoji != null) update.emoji = body.data.emoji;
  if (body.data.description !== undefined) update.description = body.data.description;
  if (body.data.color != null) update.color = body.data.color;
  if (body.data.isShared != null) update.isShared = body.data.isShared;
  if (body.data.sharedWithGroup !== undefined) update.sharedWithGroup = body.data.sharedWithGroup;

  const [place] = await db
    .update(personalPlacesTable)
    .set(update)
    .where(
      and(eq(personalPlacesTable.id, params.data.id), eq(personalPlacesTable.userId, req.userId!))
    )
    .returning();

  if (!place) {
    res.status(404).json({ error: "الموقع غير موجود" });
    return;
  }

  res.json({
    ...place,
    lastVisitedAt: place.lastVisitedAt?.toISOString() ?? null,
    createdAt: place.createdAt.toISOString(),
    updatedAt: place.updatedAt.toISOString(),
    distanceFromUserM: null,
  });
});

router.delete("/places/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeletePlaceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(personalPlacesTable)
    .where(
      and(eq(personalPlacesTable.id, params.data.id), eq(personalPlacesTable.userId, req.userId!))
    )
    .returning({ id: personalPlacesTable.id });

  if (!deleted) {
    res.status(404).json({ error: "الموقع غير موجود" });
    return;
  }

  res.sendStatus(204);
});

export default router;
