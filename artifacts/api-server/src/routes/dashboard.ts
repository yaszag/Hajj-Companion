import { Router } from "express";
import { eq, count, desc } from "drizzle-orm";
import {
  db,
  usersTable,
  groupsTable,
  manasikProgressTable,
  personalPlacesTable,
  emergencyAlertsTable,
} from "@workspace/db";
import { MANASIK_LIST } from "@workspace/db";
import { GetDashboardQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { haversineDistance } from "../lib/geo";

const router = Router();

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const query = GetDashboardQueryParams.safeParse(req.query);
  const userLat = query.success ? query.data.lat : undefined;
  const userLng = query.success ? query.data.lng : undefined;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "المستخدم غير موجود" });
    return;
  }

  // Group info
  let groupInfo: {
    id: string;
    nameAr: string;
    memberCount: number;
    onlineCount: number;
  } | null = null;

  if (user.groupId) {
    const [group] = await db
      .select()
      .from(groupsTable)
      .where(eq(groupsTable.id, user.groupId))
      .limit(1);

    if (group) {
      const [memberCountRow] = await db
        .select({ count: count() })
        .from(usersTable)
        .where(eq(usersTable.groupId, group.id));

      groupInfo = {
        id: group.id,
        nameAr: group.nameAr,
        memberCount: Number(memberCountRow?.count ?? 0),
        onlineCount: Number(memberCountRow?.count ?? 0), // Simplified: all members "online"
      };
    }
  }

  // Manasik progress summary
  const userProgress = await db
    .select()
    .from(manasikProgressTable)
    .where(eq(manasikProgressTable.userId, req.userId!));

  const progressMap = new Map(userProgress.map((p) => [p.mansakKey, p.status]));
  const total = MANASIK_LIST.length;
  let completed = 0;
  let inProgress = 0;

  for (const item of MANASIK_LIST) {
    const status = progressMap.get(item.key) ?? "pending";
    if (status === "completed") completed++;
    else if (status === "in_progress") inProgress++;
  }

  const manasikSummary = {
    total,
    completed,
    inProgress,
    pending: total - completed - inProgress,
    percentComplete: Math.round((completed / total) * 100),
  };

  // Nearby places (up to 3 closest)
  const allPlaces = await db
    .select()
    .from(personalPlacesTable)
    .where(eq(personalPlacesTable.userId, req.userId!))
    .orderBy(desc(personalPlacesTable.visitCount))
    .limit(20);

  let nearbyPlaces = allPlaces.map((p) => ({
    ...p,
    lastVisitedAt: p.lastVisitedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    distanceFromUserM:
      userLat != null && userLng != null
        ? Math.round(haversineDistance(userLat, userLng, p.latitude, p.longitude))
        : null,
  }));

  if (userLat != null && userLng != null) {
    nearbyPlaces = nearbyPlaces
      .sort((a, b) => (a.distanceFromUserM ?? 0) - (b.distanceFromUserM ?? 0))
      .slice(0, 3);
  } else {
    nearbyPlaces = nearbyPlaces.slice(0, 3);
  }

  // Active emergency
  const [activeEmergency] = await db
    .select({ id: emergencyAlertsTable.id, alertType: emergencyAlertsTable.alertType, status: emergencyAlertsTable.status })
    .from(emergencyAlertsTable)
    .where(
      eq(emergencyAlertsTable.userId, req.userId!)
    )
    .orderBy(desc(emergencyAlertsTable.createdAt))
    .limit(1);

  const activeAlert =
    activeEmergency?.status === "active"
      ? { id: activeEmergency.id, alertType: activeEmergency.alertType, status: activeEmergency.status }
      : null;

  // Sanitize user
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user;

  res.json({
    user: safeUser,
    group: groupInfo,
    manasikSummary,
    nearbyPlaces,
    activeEmergency: activeAlert,
  });
});

export default router;
