import { Router } from "express";
import { eq, count } from "drizzle-orm";
import { db, groupsTable, usersTable, locationHistoryTable } from "@workspace/db";
import { CreateGroupBody, JoinGroupBody, GetGroupParams, GetGroupMembersParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router = Router();

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

router.post("/groups", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { nameAr, agency, maxMembers } = parsed.data;

  let inviteCode = generateInviteCode();
  // Ensure uniqueness
  let attempts = 0;
  while (attempts < 5) {
    const existing = await db.select({ id: groupsTable.id }).from(groupsTable).where(eq(groupsTable.inviteCode, inviteCode)).limit(1);
    if (existing.length === 0) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  const [group] = await db.insert(groupsTable).values({
    nameAr,
    agency: agency ?? null,
    leaderId: req.userId!,
    inviteCode,
    maxMembers: maxMembers ?? 50,
  }).returning();

  await db.update(usersTable).set({ groupId: group.id }).where(eq(usersTable.id, req.userId!));

  const [memberCountRow] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.groupId, group.id));

  res.status(201).json({ ...group, memberCount: Number(memberCountRow?.count ?? 1) });
});

router.post("/groups/join", requireAuth, async (req, res): Promise<void> => {
  const parsed = JoinGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { inviteCode } = parsed.data;

  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.inviteCode, inviteCode.toUpperCase())).limit(1);
  if (!group) {
    res.status(404).json({ error: "رمز الدعوة غير صحيح" });
    return;
  }

  const [memberCountRow] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.groupId, group.id));
  if (Number(memberCountRow?.count ?? 0) >= group.maxMembers) {
    res.status(400).json({ error: "المجموعة ممتلئة" });
    return;
  }

  await db.update(usersTable).set({ groupId: group.id }).where(eq(usersTable.id, req.userId!));

  const [updatedCount] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.groupId, group.id));
  res.json({ ...group, memberCount: Number(updatedCount?.count ?? 1) });
});

router.get("/groups/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, params.data.id)).limit(1);
  if (!group) {
    res.status(404).json({ error: "المجموعة غير موجودة" });
    return;
  }
  const [memberCountRow] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.groupId, group.id));
  res.json({ ...group, memberCount: Number(memberCountRow?.count ?? 0) });
});

router.get("/groups/:id/members", requireAuth, async (req, res): Promise<void> => {
  const params = GetGroupMembersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const members = await db.select({
    id: usersTable.id,
    fullNameAr: usersTable.fullNameAr,
    fullNameEn: usersTable.fullNameEn,
    phone: usersTable.phone,
    tentZone: usersTable.tentZone,
  }).from(usersTable).where(eq(usersTable.groupId, params.data.id));

  // Get latest location for each member
  const membersWithLocation = await Promise.all(
    members.map(async (m) => {
      const [loc] = await db
        .select({ latitude: locationHistoryTable.latitude, longitude: locationHistoryTable.longitude, recordedAt: locationHistoryTable.recordedAt })
        .from(locationHistoryTable)
        .where(eq(locationHistoryTable.userId, m.id))
        .orderBy(locationHistoryTable.recordedAt)
        .limit(1);
      return {
        ...m,
        lastLat: loc?.latitude ?? null,
        lastLng: loc?.longitude ?? null,
        lastSeenAt: loc?.recordedAt?.toISOString() ?? null,
      };
    })
  );

  res.json(membersWithLocation);
});

export default router;
