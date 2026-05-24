import { Router } from "express";
import { eq, and, asc, sql } from "drizzle-orm";
import { db, arafahPlansTable, arafahTimeBlocksTable, arafahGoalsTable, arafahDuaProgressTable, arafahSessionStatesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

const CURRENT_YEAR = new Date().getFullYear();

const DEFAULT_BLOCKS = [
  { labelAr: "الفجر - الشروق", labelEn: "Fajr - Sunrise", startTime: "05:00", endTime: "06:30", orderIndex: 1, moodColor: "#1a1a2e" },
  { labelAr: "الصباح", labelEn: "Late Morning", startTime: "06:30", endTime: "12:00", orderIndex: 2, moodColor: "#3a5a40" },
  { labelAr: "الظهر - العصر", labelEn: "Noon - Afternoon", startTime: "12:00", endTime: "15:00", orderIndex: 3, moodColor: "#a67c00" },
  { labelAr: "العصر - المغرب", labelEn: "Late Afternoon - Maghrib", startTime: "15:00", endTime: "18:00", orderIndex: 4, moodColor: "#8b4513" },
  { labelAr: "المغرب - العشاء", labelEn: "Maghrib - Isha", startTime: "18:00", endTime: "20:00", orderIndex: 5, moodColor: "#2d1b69" },
];

const DEFAULT_GOALS: { blockIndex: number; titleAr: string; arabicText: string; targetValue: number; goalType: string; targetType: string }[] = [
  { blockIndex: 0, titleAr: "سبحان الله × ١٠٠", arabicText: "سُبْحَانَ اللَّهِ", targetValue: 100, goalType: "tasbeeh", targetType: "count" },
  { blockIndex: 0, titleAr: "الحمد لله × ١٠٠", arabicText: "الْحَمْدُ لِلَّهِ", targetValue: 100, goalType: "tasbeeh", targetType: "count" },
  { blockIndex: 0, titleAr: "الله أكبر × ١٠٠", arabicText: "اللَّهُ أَكْبَرُ", targetValue: 100, goalType: "tasbeeh", targetType: "count" },
  { blockIndex: 1, titleAr: "أستغفر الله × ٥٠٠", arabicText: "أَسْتَغْفِرُ اللَّهَ", targetValue: 500, goalType: "tasbeeh", targetType: "count" },
  { blockIndex: 1, titleAr: "الصلاة على النبي × ٥٠٠", arabicText: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", targetValue: 500, goalType: "salawat", targetType: "count" },
  { blockIndex: 2, titleAr: "قراءة ٣ أدعية طويلة", arabicText: "", targetValue: 3, goalType: "dua_read", targetType: "count" },
  { blockIndex: 2, titleAr: "لا إله إلا الله × ١٠٠٠", arabicText: "لَا إِلَهَ إِلَّا اللَّهُ", targetValue: 1000, goalType: "dhikr", targetType: "count" },
  { blockIndex: 3, titleAr: "سبحان الله وبحمده × ١٠٠", arabicText: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", targetValue: 100, goalType: "tasbeeh", targetType: "count" },
  { blockIndex: 3, titleAr: "دعاء عرفة المأثور", arabicText: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", targetValue: 1, goalType: "dua_read", targetType: "count" },
  { blockIndex: 4, titleAr: "حسبنا الله ونعم الوكيل × ١٠٠", arabicText: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", targetValue: 100, goalType: "dhikr", targetType: "count" },
];

// GET /arafah/plan — get or create plan for current year
router.get("/arafah/plan", requireAuth, async (req, res): Promise<void> => {
  let plan = await db
    .select()
    .from(arafahPlansTable)
    .where(
      and(
        eq(arafahPlansTable.userId, req.userId!),
        eq(arafahPlansTable.year, CURRENT_YEAR)
      )
    )
    .limit(1)
    .then((r) => r[0] || null);

  if (!plan) {
    [plan] = await db
      .insert(arafahPlansTable)
      .values({ userId: req.userId!, year: CURRENT_YEAR, status: "active" })
      .returning();

    const blocks = await db
      .insert(arafahTimeBlocksTable)
      .values(DEFAULT_BLOCKS.map((b) => ({ ...b, planId: plan.id })))
      .returning();

    await db.insert(arafahGoalsTable).values(
      DEFAULT_GOALS.map((g) => ({
        ...g,
        planId: plan.id,
        blockId: blocks[g.blockIndex].id,
      }))
    );
  }

  const blocks = await db
    .select()
    .from(arafahTimeBlocksTable)
    .where(eq(arafahTimeBlocksTable.planId, plan.id))
    .orderBy(arafahTimeBlocksTable.orderIndex);

  const goals = await db
    .select()
    .from(arafahGoalsTable)
    .where(eq(arafahGoalsTable.planId, plan.id))
    .orderBy(arafahGoalsTable.orderIndex);

  const duaProgress = await db
    .select()
    .from(arafahDuaProgressTable)
    .where(eq(arafahDuaProgressTable.planId, plan.id));

  res.json({ plan, blocks, goals, duaProgress });
});

// POST /arafah/goals — create custom goal
router.post("/arafah/goals", requireAuth, async (req, res): Promise<void> => {
  const { planId, blockId, goalType, targetValue, titleAr, arabicText, refType, refId } = req.body;

  if (!planId || !goalType || !targetValue || !titleAr) {
    res.status(400).json({ error: "Missing required fields: planId, goalType, targetValue, titleAr" });
    return;
  }

  const plan = await db
    .select()
    .from(arafahPlansTable)
    .where(and(eq(arafahPlansTable.id, planId), eq(arafahPlansTable.userId, req.userId!)))
    .limit(1)
    .then((r) => r[0]);

  if (!plan) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  const maxOrder = await db
    .select({ max: sql<number>`COALESCE(MAX(${arafahGoalsTable.orderIndex}), 0)` })
    .from(arafahGoalsTable)
    .where(eq(arafahGoalsTable.planId, planId))
    .then((r) => r[0]?.max || 0);

  const [goal] = await db
    .insert(arafahGoalsTable)
    .values({
      planId,
      blockId: blockId || null,
      goalType,
      targetType: "count",
      targetValue: targetValue || 1,
      titleAr,
      arabicText: arabicText || null,
      refType: refType || null,
      refId: refId || null,
      orderIndex: maxOrder + 1,
    })
    .returning();

  res.json(goal);
});

// GET /arafah/goals/:id — get single goal for counter screen
router.get("/arafah/goals/:id", requireAuth, async (req, res): Promise<void> => {
  const goal = await db
    .select()
    .from(arafahGoalsTable)
    .where(eq(arafahGoalsTable.id, req.params.id))
    .limit(1)
    .then((r) => r[0]);

  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  const plan = await db
    .select()
    .from(arafahPlansTable)
    .where(and(eq(arafahPlansTable.id, goal.planId), eq(arafahPlansTable.userId, req.userId!)))
    .limit(1)
    .then((r) => r[0]);

  if (!plan) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(goal);
});

// POST /arafah/goals/:id/increment
router.post("/arafah/goals/:id/increment", requireAuth, async (req, res): Promise<void> => {
  const goal = await db
    .select()
    .from(arafahGoalsTable)
    .where(eq(arafahGoalsTable.id, req.params.id))
    .limit(1)
    .then((r) => r[0]);

  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  const newCount = (goal.currentCount || 0) + 1;
  const completed = newCount >= goal.targetValue;

  const [updated] = await db
    .update(arafahGoalsTable)
    .set({
      currentCount: newCount,
      completed,
      completedAt: completed ? new Date() : goal.completedAt,
    })
    .where(eq(arafahGoalsTable.id, goal.id))
    .returning();

  if (completed) {
    await db
      .update(arafahPlansTable)
      .set({ goalsCompleted: sql`goals_completed + 1` })
      .where(eq(arafahPlansTable.id, goal.planId));
  }

  res.json(updated);
});

// POST /arafah/goals/:id/complete — manual complete (for boolean goals)
router.post("/arafah/goals/:id/complete", requireAuth, async (req, res): Promise<void> => {
  const goal = await db
    .select()
    .from(arafahGoalsTable)
    .where(eq(arafahGoalsTable.id, req.params.id))
    .limit(1)
    .then((r) => r[0]);

  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  const [updated] = await db
    .update(arafahGoalsTable)
    .set({
      completed: true,
      completedAt: new Date(),
      currentCount: goal.targetValue,
    })
    .where(eq(arafahGoalsTable.id, goal.id))
    .returning();

  await db
    .update(arafahPlansTable)
    .set({ goalsCompleted: sql`goals_completed + 1` })
    .where(eq(arafahPlansTable.id, goal.planId));

  res.json(updated);
});

// POST /arafah/goals/:id/revert — un-complete a goal
router.post("/arafah/goals/:id/revert", requireAuth, async (req, res): Promise<void> => {
  const goal = await db
    .select()
    .from(arafahGoalsTable)
    .where(eq(arafahGoalsTable.id, req.params.id))
    .limit(1)
    .then((r) => r[0]);

  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  const plan = await db
    .select()
    .from(arafahPlansTable)
    .where(and(eq(arafahPlansTable.id, goal.planId), eq(arafahPlansTable.userId, req.userId!)))
    .limit(1)
    .then((r) => r[0]);

  if (!plan) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db
    .update(arafahGoalsTable)
    .set({
      completed: false,
      completedAt: null,
      currentCount: 0,
    })
    .where(eq(arafahGoalsTable.id, goal.id))
    .returning();

  if (goal.completed) {
    await db
      .update(arafahPlansTable)
      .set({ goalsCompleted: sql`GREATEST(goals_completed - 1, 0)` })
      .where(eq(arafahPlansTable.id, goal.planId));
  }

  res.json(updated);
});

// DELETE /arafah/goals/:id — delete a goal
router.delete("/arafah/goals/:id", requireAuth, async (req, res): Promise<void> => {
  const goal = await db
    .select()
    .from(arafahGoalsTable)
    .where(eq(arafahGoalsTable.id, req.params.id))
    .limit(1)
    .then((r) => r[0]);

  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  const plan = await db
    .select()
    .from(arafahPlansTable)
    .where(and(eq(arafahPlansTable.id, goal.planId), eq(arafahPlansTable.userId, req.userId!)))
    .limit(1)
    .then((r) => r[0]);

  if (!plan) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(arafahGoalsTable).where(eq(arafahGoalsTable.id, goal.id));

  if (goal.completed) {
    await db
      .update(arafahPlansTable)
      .set({ goalsCompleted: sql`GREATEST(goals_completed - 1, 0)` })
      .where(eq(arafahPlansTable.id, goal.planId));
  }

  res.json({ success: true });
});

// POST /arafah/dua/:id/progress — update dua reading progress
router.post("/arafah/dua/:id/progress", requireAuth, async (req, res): Promise<void> => {
  const { planId, status, lastPosition } = req.body;

  const existing = await db
    .select()
    .from(arafahDuaProgressTable)
    .where(
      and(
        eq(arafahDuaProgressTable.duaId, req.params.id),
        eq(arafahDuaProgressTable.planId, planId)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  let result;
  if (existing) {
    [result] = await db
      .update(arafahDuaProgressTable)
      .set({
        status: status || existing.status,
        lastPosition: lastPosition ?? existing.lastPosition,
        readCount: status === "completed" ? sql`read_count + 1` : existing.readCount,
        completedAt: status === "completed" ? new Date() : existing.completedAt,
      })
      .where(eq(arafahDuaProgressTable.id, existing.id))
      .returning();
  } else {
    [result] = await db
      .insert(arafahDuaProgressTable)
      .values({
        planId,
        duaId: req.params.id,
        status: status || "reading",
        lastPosition: lastPosition || null,
        startedAt: new Date(),
      })
      .returning();
  }

  res.json(result);
});

// GET /arafah/session — restore session
router.get("/arafah/session", requireAuth, async (req, res): Promise<void> => {
  const session = await db
    .select()
    .from(arafahSessionStatesTable)
    .where(eq(arafahSessionStatesTable.userId, req.userId!))
    .limit(1)
    .then((r) => r[0] || null);

  res.json(session);
});

// POST /arafah/session — save session
router.post("/arafah/session", requireAuth, async (req, res): Promise<void> => {
  const { planId, activeScreen, activeGoalId, activeDuaId, activeDuaPosition } = req.body;

  const existing = await db
    .select()
    .from(arafahSessionStatesTable)
    .where(eq(arafahSessionStatesTable.userId, req.userId!))
    .limit(1)
    .then((r) => r[0]);

  let result;
  if (existing) {
    [result] = await db
      .update(arafahSessionStatesTable)
      .set({
        planId: planId ?? existing.planId,
        activeScreen: activeScreen ?? existing.activeScreen,
        activeGoalId: activeGoalId ?? existing.activeGoalId,
        activeDuaId: activeDuaId ?? existing.activeDuaId,
        activeDuaPosition: activeDuaPosition ?? existing.activeDuaPosition,
        lastActiveAt: new Date(),
      })
      .where(eq(arafahSessionStatesTable.userId, req.userId!))
      .returning();
  } else {
    [result] = await db
      .insert(arafahSessionStatesTable)
      .values({
        userId: req.userId!,
        planId,
        activeScreen,
        activeGoalId,
        activeDuaId,
        activeDuaPosition,
      })
      .returning();
  }

  res.json(result);
});

export default router;
