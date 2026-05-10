import { Router } from "express";
import { eq, and, ilike, or } from "drizzle-orm";
import { db, duasTable, duaCategoriesTable, userDuaFavoritesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /duas/categories
router.get("/duas/categories", requireAuth, async (req, res): Promise<void> => {
  const categories = await db
    .select()
    .from(duaCategoriesTable)
    .orderBy(duaCategoriesTable.orderIndex);

  res.json(categories);
});

// GET /duas/favorites
router.get("/duas/favorites", requireAuth, async (req, res): Promise<void> => {
  const favorites = await db
    .select({
      id: duasTable.id,
      titleAr: duasTable.titleAr,
      titleEn: duasTable.titleEn,
      arabicText: duasTable.arabicText,
      source: duasTable.source,
      duaType: duasTable.duaType,
      isFeatured: duasTable.isFeatured,
      categoryId: duasTable.categoryId,
      orderIndex: duasTable.orderIndex,
      createdAt: duasTable.createdAt,
    })
    .from(userDuaFavoritesTable)
    .innerJoin(duasTable, eq(userDuaFavoritesTable.duaId, duasTable.id))
    .where(eq(userDuaFavoritesTable.userId, req.userId!))
    .orderBy(userDuaFavoritesTable.createdAt);

  const favIds = await getUserFavIds(req.userId!);
  res.json(favorites.map((d) => ({ ...d, isFavorited: favIds.has(d.id), createdAt: d.createdAt.toISOString() })));
});

// GET /duas/by-mansak/:mansakKey
router.get("/duas/by-mansak/:mansakKey", requireAuth, async (req, res): Promise<void> => {
  const mansakKey = String(req.params.mansakKey);
  const duas = await db
    .select()
    .from(duasTable)
    .where(eq(duasTable.mansakKey, mansakKey))
    .orderBy(duasTable.orderIndex);

  const favIds = await getUserFavIds(req.userId!);
  res.json(duas.map((d) => ({ ...d, isFavorited: favIds.has(d.id), createdAt: d.createdAt.toISOString() })));
});

// GET /duas
router.get("/duas", requireAuth, async (req, res): Promise<void> => {
  const {
    category_id,
    type,
    search,
    page = "0",
    size = "20",
  } = req.query as Record<string, string>;

  const pageNum = Math.max(0, parseInt(page, 10) || 0);
  const pageSize = Math.min(100, Math.max(1, parseInt(size, 10) || 20));

  const conditions: ReturnType<typeof eq>[] = [];
  if (category_id) conditions.push(eq(duasTable.categoryId, category_id));
  if (type) conditions.push(eq(duasTable.duaType, type));
  if (search) {
    conditions.push(
      or(
        ilike(duasTable.titleAr, `%${search}%`),
        ilike(duasTable.arabicText, `%${search}%`)
      ) as ReturnType<typeof eq>
    );
  }

  const all = conditions.length > 0
    ? await db.select().from(duasTable).where(and(...conditions)).orderBy(duasTable.orderIndex)
    : await db.select().from(duasTable).orderBy(duasTable.orderIndex);

  const total = all.length;
  const content = all.slice(pageNum * pageSize, (pageNum + 1) * pageSize);
  const favIds = await getUserFavIds(req.userId!);

  res.json({
    content: content.map((d) => ({
      id: d.id,
      titleAr: d.titleAr,
      titleEn: d.titleEn,
      arabicText: d.arabicText.substring(0, 150) + (d.arabicText.length > 150 ? "..." : ""),
      source: d.source,
      duaType: d.duaType,
      categoryId: d.categoryId,
      isFeatured: d.isFeatured,
      isFavorited: favIds.has(d.id),
      createdAt: d.createdAt.toISOString(),
    })),
    total,
    page: pageNum,
    size: pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

// GET /duas/:id
router.get("/duas/:id", requireAuth, async (req, res): Promise<void> => {
  const id = String(req.params.id);

  const [dua] = await db
    .select()
    .from(duasTable)
    .where(eq(duasTable.id, id))
    .limit(1);

  if (!dua) {
    res.status(404).json({ error: "الدعاء غير موجود" });
    return;
  }

  let category = null;
  if (dua.categoryId) {
    const [cat] = await db
      .select()
      .from(duaCategoriesTable)
      .where(eq(duaCategoriesTable.id, dua.categoryId))
      .limit(1);
    category = cat ?? null;
  }

  // Related duas (same category, excluding self)
  const related = dua.categoryId
    ? (
        await db
          .select({ id: duasTable.id, titleAr: duasTable.titleAr, source: duasTable.source })
          .from(duasTable)
          .where(eq(duasTable.categoryId, dua.categoryId))
          .orderBy(duasTable.orderIndex)
          .limit(6)
      ).filter((r) => r.id !== id).slice(0, 5)
    : [];

  const [favRow] = await db
    .select({ id: userDuaFavoritesTable.id })
    .from(userDuaFavoritesTable)
    .where(
      and(
        eq(userDuaFavoritesTable.userId, req.userId!),
        eq(userDuaFavoritesTable.duaId, id)
      )
    )
    .limit(1);

  res.json({
    ...dua,
    createdAt: dua.createdAt.toISOString(),
    isFavorited: !!favRow,
    category,
    related,
  });
});

// POST /duas/:id/favorite
router.post("/duas/:id/favorite", requireAuth, async (req, res): Promise<void> => {
  const id = String(req.params.id);

  const [dua] = await db
    .select({ id: duasTable.id })
    .from(duasTable)
    .where(eq(duasTable.id, id))
    .limit(1);

  if (!dua) {
    res.status(404).json({ error: "الدعاء غير موجود" });
    return;
  }

  await db
    .insert(userDuaFavoritesTable)
    .values({ userId: req.userId!, duaId: id })
    .onConflictDoNothing();

  res.status(201).json({ success: true });
});

// DELETE /duas/:id/favorite
router.delete("/duas/:id/favorite", requireAuth, async (req, res): Promise<void> => {
  const id = String(req.params.id);

  await db
    .delete(userDuaFavoritesTable)
    .where(
      and(
        eq(userDuaFavoritesTable.userId, req.userId!),
        eq(userDuaFavoritesTable.duaId, id)
      )
    );

  res.sendStatus(204);
});

async function getUserFavIds(userId: string): Promise<Set<string>> {
  const favs = await db
    .select({ duaId: userDuaFavoritesTable.duaId })
    .from(userDuaFavoritesTable)
    .where(eq(userDuaFavoritesTable.userId, userId));
  return new Set(favs.map((f) => f.duaId));
}

export default router;
