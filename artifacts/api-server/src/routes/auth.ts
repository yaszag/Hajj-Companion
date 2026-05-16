import { randomUUID } from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, groupsTable } from "@workspace/db";
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

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generatePlaceholderPassport(): string {
  // Must fit users.passport_no varchar(20)
  const hex = randomUUID().replace(/-/g, "");
  return `NP-${hex.slice(0, 17)}`;
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    firstName,
    lastName,
    nationality,
    phone,
    password,
    hotelName,
    groupName,
    passportNo: passportNoRaw,
    fullNameAr: fullNameArRaw,
    fullNameEn,
    tentZone: tentZoneRaw,
    emergencyContact,
  } = parsed.data;

  if (!/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
    res.status(400).json({
      error: "يجب أن تحتوي كلمة المرور على رقم وحرف على الأقل",
    });
    return;
  }

  const fullNameAr = (
    fullNameArRaw?.trim() ||
    `${firstName.trim()} ${lastName.trim()}`.trim()
  ).slice(0, 100);
  const userSuppliedPassport = Boolean(passportNoRaw?.trim());
  let passportNo = passportNoRaw?.trim() || generatePlaceholderPassport();
  if (passportNo.length > 20) {
    res.status(400).json({ error: "رقم الجواز يجب ألا يتجاوز 20 حرفاً" });
    return;
  }
  const tentZoneRawCombined = tentZoneRaw?.trim() || hotelName.trim();
  const tentZone = tentZoneRawCombined
    ? tentZoneRawCombined.slice(0, 200)
    : null;
  const nat = nationality.trim().toUpperCase();

  const [phoneHit] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.phone, phone.trim()))
    .limit(1);
  if (phoneHit) {
    res.status(409).json({ error: "رقم الهاتف مستخدم بالفعل" });
    return;
  }

  if (userSuppliedPassport) {
    const [dupPass] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.passportNo, passportNo))
      .limit(1);
    if (dupPass) {
      res.status(409).json({ error: "رقم الجواز مسجل مسبقاً" });
      return;
    }
  } else {
    let dup = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.passportNo, passportNo))
      .limit(1);
    let attempts = 0;
    while (dup.length > 0 && attempts < 8) {
      passportNo = generatePlaceholderPassport();
      dup = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.passportNo, passportNo))
        .limit(1);
      attempts++;
    }
    if (dup.length > 0) {
      res.status(409).json({ error: "تعذر إنشاء رقم جواز فريد، حاول مجدداً" });
      return;
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(usersTable)
        .values({
          passportNo,
          fullNameAr,
          fullNameEn: fullNameEn ?? null,
          nationality: nat,
          phone: phone.trim(),
          passwordHash,
          tentZone: tentZone,
          emergencyContact: emergencyContact ?? null,
        })
        .returning();

      let inviteCode = generateInviteCode();
      let inviteAttempts = 0;
      while (inviteAttempts < 5) {
        const existing = await tx
          .select({ id: groupsTable.id })
          .from(groupsTable)
          .where(eq(groupsTable.inviteCode, inviteCode))
          .limit(1);
        if (existing.length === 0) break;
        inviteCode = generateInviteCode();
        inviteAttempts++;
      }

      const [group] = await tx
        .insert(groupsTable)
        .values({
          nameAr: groupName.trim().slice(0, 100),
          agency: null,
          leaderId: user.id,
          inviteCode,
          maxMembers: 50,
        })
        .returning();

      await tx
        .update(usersTable)
        .set({ groupId: group.id })
        .where(eq(usersTable.id, user.id));

      return {
        user: { ...user, groupId: group.id },
      };
    });

    const payload = { userId: result.user.id, phone: result.user.phone };
    res.status(201).json({
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: sanitizeUser(result.user),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("register transaction failed", msg, e);
    res.status(500).json({ error: "حدث خطأ أثناء إنشاء الحساب" });
  }
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
