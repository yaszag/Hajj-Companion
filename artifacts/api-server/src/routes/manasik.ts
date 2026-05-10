import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, manasikProgressTable } from "@workspace/db";
import { MANASIK_LIST } from "@workspace/db";
import { UpdateManasikProgressParams, UpdateManasikProgressBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/manasik", requireAuth, async (req, res): Promise<void> => {
  const progress = await db
    .select()
    .from(manasikProgressTable)
    .where(eq(manasikProgressTable.userId, req.userId!));

  const progressMap = new Map(progress.map((p) => [p.mansakKey, p]));

  const items = MANASIK_LIST.map((item) => {
    const p = progressMap.get(item.key);
    return {
      ...item,
      status: p?.status ?? "pending",
      startedAt: p?.startedAt?.toISOString() ?? null,
      completedAt: p?.completedAt?.toISOString() ?? null,
    };
  });

  res.json(items);
});

router.patch("/manasik/:key/progress", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateManasikProgressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateManasikProgressBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { key } = params.data;
  const { status } = body.data;

  const manasikDef = MANASIK_LIST.find((m) => m.key === key);
  if (!manasikDef) {
    res.status(404).json({ error: "النسك غير موجود" });
    return;
  }

  const now = new Date();
  const updateData: Record<string, unknown> = { status };
  if (status === "in_progress") updateData.startedAt = now;
  if (status === "completed") {
    updateData.completedAt = now;
    updateData.startedAt = now;
  }

  const [existing] = await db
    .select()
    .from(manasikProgressTable)
    .where(and(eq(manasikProgressTable.userId, req.userId!), eq(manasikProgressTable.mansakKey, key)))
    .limit(1);

  let progress;
  if (existing) {
    [progress] = await db
      .update(manasikProgressTable)
      .set(updateData)
      .where(and(eq(manasikProgressTable.userId, req.userId!), eq(manasikProgressTable.mansakKey, key)))
      .returning();
  } else {
    [progress] = await db
      .insert(manasikProgressTable)
      .values({
        userId: req.userId!,
        mansakKey: key,
        status,
        startedAt: updateData.startedAt as Date | undefined,
        completedAt: updateData.completedAt as Date | undefined,
      })
      .returning();
  }

  res.json({
    ...manasikDef,
    status: progress.status,
    startedAt: progress.startedAt?.toISOString() ?? null,
    completedAt: progress.completedAt?.toISOString() ?? null,
  });
});

export default router;
