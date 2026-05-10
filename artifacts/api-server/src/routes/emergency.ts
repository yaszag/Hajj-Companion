import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, emergencyAlertsTable } from "@workspace/db";
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

export default router;
