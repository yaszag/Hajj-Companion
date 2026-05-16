import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, emergencyAlertsTable, usersTable, groupsTable, groupMembersTable } from "@workspace/db";
import { SendSosBody, ResolveEmergencyParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router = Router();

router.post("/emergency/sos", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendSosBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [alert] = await db
    .insert(emergencyAlertsTable)
    .values({
      userId: req.userId!,
      alertType: parsed.data.alertType ?? "sos",
      message: parsed.data.message ?? null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
    })
    .returning();

  res.status(201).json({
    ...alert,
    createdAt: alert.createdAt.toISOString(),
    resolvedAt: alert.resolvedAt?.toISOString() ?? null,
  });
});

router.patch("/emergency/:id/resolve", requireAuth, async (req, res): Promise<void> => {
  const params = ResolveEmergencyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [alert] = await db
    .update(emergencyAlertsTable)
    .set({ status: "resolved", resolvedAt: new Date() })
    .where(
      and(
        eq(emergencyAlertsTable.id, params.data.id),
        eq(emergencyAlertsTable.userId, req.userId!)
      )
    )
    .returning();

  if (!alert) {
    res.status(404).json({ error: "التنبيه غير موجود" });
    return;
  }

  res.json({
    ...alert,
    createdAt: alert.createdAt.toISOString(),
    resolvedAt: alert.resolvedAt?.toISOString() ?? null,
  });
});

// Get active emergency alerts for all members of the current user's group
router.get("/emergency/group/:groupId", requireAuth, async (req, res): Promise<void> => {
  try {
    const groupId = req.params.groupId;

    // Verify the user is a member of this group
    const [userCheck] = await db
      .select({ groupId: groupMembersTable.groupId })
      .from(groupMembersTable)
      .where(eq(groupMembersTable.userId, req.userId!))
      .limit(1);

    if (!userCheck || userCheck.groupId !== groupId) {
      res.status(403).json({ error: "غير مصرح لك بالوصول" });
      return;
    }

    // Get all active alerts for members of this group
    const alerts = await db
      .select({
        id: emergencyAlertsTable.id,
        userId: emergencyAlertsTable.userId,
        alertType: emergencyAlertsTable.alertType,
        message: emergencyAlertsTable.message,
        latitude: emergencyAlertsTable.latitude,
        longitude: emergencyAlertsTable.longitude,
        status: emergencyAlertsTable.status,
        createdAt: emergencyAlertsTable.createdAt,
        resolvedAt: emergencyAlertsTable.resolvedAt,
      })
      .from(emergencyAlertsTable)
      .innerJoin(groupMembersTable, eq(emergencyAlertsTable.userId, groupMembersTable.userId))
      .where(
        and(
          eq(groupMembersTable.groupId, groupId),
          eq(emergencyAlertsTable.status, "active")
        )
      )
      .orderBy(desc(emergencyAlertsTable.createdAt));

    // Enrich with user info
    const enriched = await Promise.all(
      alerts.map(async (alert) => {
        const [user] = await db
          .select({
            fullNameAr: usersTable.fullNameAr,
            phone: usersTable.phone,
            tentZone: usersTable.tentZone,
          })
          .from(usersTable)
          .where(eq(usersTable.id, alert.userId))
          .limit(1);

        return {
          ...alert,
          user: user ?? null,
          createdAt: alert.createdAt.toISOString(),
          resolvedAt: alert.resolvedAt?.toISOString() ?? null,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error("Error fetching group emergency alerts:", err);
    res.status(500).json({ error: "حدث خطأ في جلب تنبيهات الطوارئ" });
  }
});

export default router;
