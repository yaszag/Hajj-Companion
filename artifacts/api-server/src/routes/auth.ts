import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  RegisterBody,
  LoginBody,
  RefreshTokenBody,
} from "@workspace/api-zod";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  requireAuth,
} from "../lib/auth";

const router = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { passportNo, fullNameAr, fullNameEn, nationality, phone, password, tentZone, emergencyContact } = parsed.data;

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(or(eq(usersTable.phone, phone), eq(usersTable.passportNo, passportNo)))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "رقم الهاتف أو رقم الجواز مسجل مسبقاً" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    passportNo,
    fullNameAr,
    fullNameEn: fullNameEn ?? null,
    nationality,
    phone,
    passwordHash,
    tentZone: tentZone ?? null,
    emergencyContact: emergencyContact ?? null,
  }).returning();

  const payload = { userId: user.id, phone: user.phone };
  res.status(201).json({
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: sanitizeUser(user),
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phone, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phone, phone))
    .limit(1);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "رقم الهاتف أو كلمة المرور غير صحيحة" });
    return;
  }

  const payload = { userId: user.id, phone: user.phone };
  res.json({
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: sanitizeUser(user),
  });
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const parsed = RefreshTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const payload = verifyRefreshToken(parsed.data.refreshToken);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);
    if (!user) {
      res.status(401).json({ error: "المستخدم غير موجود" });
      return;
    }
    const newPayload = { userId: user.id, phone: user.phone };
    res.json({
      accessToken: signAccessToken(newPayload),
      refreshToken: signRefreshToken(newPayload),
      user: sanitizeUser(user),
    });
  } catch {
    res.status(401).json({ error: "رمز التحديث غير صالح أو منتهي الصلاحية" });
  }
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "المستخدم غير موجود" });
    return;
  }
  res.json(sanitizeUser(user));
});

// PATCH /auth/nusuk-type — set Hajj type (ifrad / tamattu / qiran)
router.patch("/auth/nusuk-type", requireAuth, async (req, res): Promise<void> => {
  const { nusukType } = req.body;
  if (!["ifrad", "tamattu", "qiran"].includes(nusukType)) {
    res.status(400).json({ error: "نوع النسك غير صحيح — يجب أن يكون: ifrad أو tamattu أو qiran" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ nusukType })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  if (!user) {
    res.status(404).json({ error: "المستخدم غير موجود" });
    return;
  }

  res.json(sanitizeUser(user));
});

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

export default router;
