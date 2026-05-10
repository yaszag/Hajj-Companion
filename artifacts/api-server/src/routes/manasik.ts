import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, manasikProgressTable, manasikProgressHistoryTable, usersTable, MANASIK_LIST } from "@workspace/db";
import type { NusukType } from "@workspace/db";
import { UpdateManasikProgressParams, UpdateManasikProgressBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/manasik", requireAuth, async (req, res): Promise<void> => {
  const [userRow] = await db
    .select({ nusukType: usersTable.nusukType })
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  const nusukType = (userRow?.nusukType ?? null) as NusukType | null;

  const progress = await db
    .select()
    .from(manasikProgressTable)
    .where(eq(manasikProgressTable.userId, req.userId!));

  const progressMap = new Map(progress.map((p) => [p.mansakKey, p]));

  const applicableItems = nusukType
    ? MANASIK_LIST.filter((item) => item.nusukTypes.includes(nusukType))
    : MANASIK_LIST;

  const items = applicableItems.map((item) => {
    const p = progressMap.get(item.key);
    return {
      key: item.key,
      titleAr: item.titleAr,
      titleEn: item.titleEn,
      order: item.order,
      day: item.day,
      descriptionAr: item.descriptionAr,
      category: item.category,
      nusukTypes: item.nusukTypes,
      steps: item.steps,
      commonMistakes: item.commonMistakes,
      malikirNote: item.malikirNote,
      practicalTip: item.practicalTip,
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
  const updateData: {
    status: string;
    startedAt?: Date | null;
    completedAt?: Date | null;
  } = { status };

  if (status === "in_progress") {
    updateData.startedAt = now;
    updateData.completedAt = null;
  } else if (status === "completed") {
    updateData.completedAt = now;
    updateData.startedAt = now;
  } else if (status === "pending") {
    updateData.startedAt = null;
    updateData.completedAt = null;
  }

  const [existing] = await db
    .select()
    .from(manasikProgressTable)
    .where(and(eq(manasikProgressTable.userId, req.userId!), eq(manasikProgressTable.mansakKey, key)))
    .limit(1);

  const fromStatus = existing?.status ?? "pending";

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
        startedAt: updateData.startedAt ?? undefined,
        completedAt: updateData.completedAt ?? undefined,
      })
      .returning();
  }

  // Log every status change for revert analytics
  if (fromStatus !== status) {
    await db.insert(manasikProgressHistoryTable).values({
      userId: req.userId!,
      mansakKey: key,
      fromStatus,
      toStatus: status,
    });
  }

  res.json({
    key: manasikDef.key,
    titleAr: manasikDef.titleAr,
    titleEn: manasikDef.titleEn,
    order: manasikDef.order,
    day: manasikDef.day,
    descriptionAr: manasikDef.descriptionAr,
    category: manasikDef.category,
    malikirNote: manasikDef.malikirNote,
    status: progress.status,
    startedAt: progress.startedAt?.toISOString() ?? null,
    completedAt: progress.completedAt?.toISOString() ?? null,
  });
});

export default router;
