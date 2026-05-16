import { Router } from "express";
import { eq, and, count, desc, sql } from "drizzle-orm";
import { db, groupsTable, usersTable, locationHistoryTable, groupMembersTable } from "@workspace/db";
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
  let attempts = 0;
  while (attempts < 5) {
    const existing = await db
      .select({ id: groupsTable.id })
      .from(groupsTable)
      .where(eq(groupsTable.inviteCode, inviteCode))
      .limit(1);
    if (existing.length === 0) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  const [group] = await db
    .insert(groupsTable)
    .values({
      nameAr,
      agency: agency ?? null,
      leaderId: req.userId!,
      inviteCode,
      maxMembers: maxMembers ?? 50,
    })
    .returning();

  await db.insert(groupMembersTable).values({
    userId: req.userId!,
    groupId: group.id,
    role: "leader",
  });

  await db.update(usersTable).set({ groupId: group.id }).where(eq(usersTable.id, req.userId!));

  const [memberCountRow] = await db
    .select({ count: count() })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.groupId, group.id));

  res.status(201).json({ ...group, memberCount: Number(memberCountRow?.count ?? 1), isLeader: true });
});

router.post("/groups/join", requireAuth, async (req, res): Promise<void> => {
  const parsed = JoinGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const inviteCode = parsed.data.inviteCode.trim().toUpperCase();

  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.inviteCode, inviteCode))
    .limit(1);

  if (!group) {
    res.status(404).json({ error: "رمز الدعوة غير صحيح — تحقق من الكود وأعد المحاولة" });
    return;
  }

  const [memberCountRow] = await db
    .select({ count: count() })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.groupId, group.id));

  if (Number(memberCountRow?.count ?? 0) >= group.maxMembers) {
    res.status(400).json({ error: "المجموعة ممتلئة — لا يمكن الانضمام" });
    return;
  }

  const [existingMembership] = await db
    .select({ id: groupMembersTable.id })
    .from(groupMembersTable)
    .where(and(
      eq(groupMembersTable.userId, req.userId!),
      eq(groupMembersTable.groupId, group.id)
    ))
    .limit(1);

  if (existingMembership) {
    res.status(400).json({ error: "أنت بالفعل عضو في هذه المجموعة" });
    return;
  }

  await db.insert(groupMembersTable).values({
    userId: req.userId!,
    groupId: group.id,
    role: "member",
  });

  await db.update(usersTable).set({ groupId: group.id }).where(eq(usersTable.id, req.userId!));

  const [updatedCount] = await db
    .select({ count: count() })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.groupId, group.id));

  res.json({ ...group, memberCount: Number(updatedCount?.count ?? 1), isLeader: false });
});

router.get("/groups/my", requireAuth, async (req, res): Promise<void> => {
  try {
    const memberships = await db
      .select({
        groupId: groupMembersTable.groupId,
        role: groupMembersTable.role,
        joinedAt: groupMembersTable.joinedAt,
        nameAr: groupsTable.nameAr,
        inviteCode: groupsTable.inviteCode,
        agency: groupsTable.agency,
        leaderId: groupsTable.leaderId,
        maxMembers: groupsTable.maxMembers,
      })
      .from(groupMembersTable)
      .innerJoin(groupsTable, eq(groupMembersTable.groupId, groupsTable.id))
      .where(eq(groupMembersTable.userId, req.userId!))
      .orderBy(desc(groupMembersTable.joinedAt));

    const groups = await Promise.all(
      memberships.map(async (m) => {
        const [memberCountRow] = await db
          .select({ count: count() })
          .from(groupMembersTable)
          .where(eq(groupMembersTable.groupId, m.groupId));

        return {
          id: m.groupId,
          nameAr: m.nameAr,
          inviteCode: m.inviteCode,
          agency: m.agency,
          leaderId: m.leaderId,
          maxMembers: m.maxMembers,
          memberCount: Number(memberCountRow?.count ?? 0),
          isLeader: m.role === "leader",
          joinedAt: m.joinedAt.toISOString(),
        };
      })
    );

    res.json(groups);
  } catch (err) {
    console.error("Error fetching user groups:", err);
    res.status(500).json({ error: "حدث خطأ في جلب المجموعات" });
  }
});

router.get("/groups/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [membership] = await db
    .select({ role: groupMembersTable.role })
    .from(groupMembersTable)
    .where(and(
      eq(groupMembersTable.groupId, params.data.id),
      eq(groupMembersTable.userId, req.userId!)
    ))
    .limit(1);

  if (!membership) {
    res.status(403).json({ error: "ليس لديك صلاحية للوصول لهذه المجموعة" });
    return;
  }

  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, params.data.id))
    .limit(1);

  if (!group) {
    res.status(404).json({ error: "المجموعة غير موجودة" });
    return;
  }

  const [memberCountRow] = await db
    .select({ count: count() })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.groupId, group.id));

  res.json({
    ...group,
    memberCount: Number(memberCountRow?.count ?? 0),
    isLeader: membership.role === "leader",
  });
});

router.get("/groups/:id/members", requireAuth, async (req, res): Promise<void> => {
  const params = GetGroupMembersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [membership] = await db
    .select({ role: groupMembersTable.role })
    .from(groupMembersTable)
    .where(and(
      eq(groupMembersTable.groupId, params.data.id),
      eq(groupMembersTable.userId, req.userId!)
    ))
    .limit(1);

  if (!membership) {
    res.status(403).json({ error: "ليس لديك صلاحية للوصول لهذه المجموعة" });
    return;
  }

  const [group] = await db
    .select({ leaderId: groupsTable.leaderId })
    .from(groupsTable)
    .where(eq(groupsTable.id, params.data.id))
    .limit(1);

  if (!group) {
    res.status(404).json({ error: "المجموعة غير موجودة" });
    return;
  }

  const members = await db
    .select({
      id: usersTable.id,
      fullNameAr: usersTable.fullNameAr,
      fullNameEn: usersTable.fullNameEn,
      phone: usersTable.phone,
      tentZone: usersTable.tentZone,
    })
    .from(groupMembersTable)
    .innerJoin(usersTable, eq(groupMembersTable.userId, usersTable.id))
    .where(eq(groupMembersTable.groupId, params.data.id));

  const membersWithLocation = await Promise.all(
    members.map(async (m) => {
      const [loc] = await db
        .select({
          latitude: locationHistoryTable.latitude,
          longitude: locationHistoryTable.longitude,
          recordedAt: locationHistoryTable.recordedAt,
        })
        .from(locationHistoryTable)
        .where(eq(locationHistoryTable.userId, m.id))
        .orderBy(desc(locationHistoryTable.recordedAt))
        .limit(1);
      return {
        ...m,
        isLeader: m.id === group.leaderId,
        lastLat: loc?.latitude ?? null,
        lastLng: loc?.longitude ?? null,
        lastSeenAt: loc?.recordedAt?.toISOString() ?? null,
      };
    })
  );

  membersWithLocation.sort((a, b) => (b.isLeader ? 1 : 0) - (a.isLeader ? 1 : 0));

  res.json(membersWithLocation);
});

router.delete("/groups/:id/leave", requireAuth, async (req, res): Promise<void> => {
  const groupId = String(req.params.id);

  const [group] = await db
    .select({ leaderId: groupsTable.leaderId })
    .from(groupsTable)
    .where(eq(groupsTable.id, groupId))
    .limit(1);

  if (!group) {
    res.status(404).json({ error: "المجموعة غير موجودة" });
    return;
  }

  if (group.leaderId === req.userId) {
    res.status(400).json({ error: "القائد لا يمكنه مغادرة المجموعة — يجب نقل القيادة أولاً" });
    return;
  }

  await db
    .delete(groupMembersTable)
    .where(and(
      eq(groupMembersTable.groupId, groupId),
      eq(groupMembersTable.userId, req.userId!)
    ));

  res.json({ success: true, message: "تم مغادرة المجموعة" });
});

router.delete("/groups/:id/members/:memberId", requireAuth, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const memberId = String(req.params.memberId);

  const [membership] = await db
    .select({ role: groupMembersTable.role })
    .from(groupMembersTable)
    .where(and(
      eq(groupMembersTable.groupId, id),
      eq(groupMembersTable.userId, req.userId!)
    ))
    .limit(1);

  if (!membership || membership.role !== "leader") {
    res.status(403).json({ error: "هذه الصلاحية للقائد فقط" });
    return;
  }

  if (memberId === req.userId) {
    res.status(400).json({ error: "لا يمكن للقائد إزالة نفسه" });
    return;
  }

  await db
    .delete(groupMembersTable)
    .where(and(
      eq(groupMembersTable.groupId, id),
      eq(groupMembersTable.userId, memberId)
    ));

  res.json({ success: true, message: "تم إزالة العضو" });
});

export default router;
