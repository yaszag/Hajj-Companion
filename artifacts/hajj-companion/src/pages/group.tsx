import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetGroup,
  useGetGroupMembers,
  useGetGroupLiveLocations,
  useJoinGroup,
  useCreateGroup,
  useGetGroupEmergencyAlerts,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users, UserPlus, Copy, Phone, MapPin,
  AlertTriangle, Clock, Navigation, MessageSquare,
  LogOut, QrCode, Bell, Share2, ArrowRight,
  Plus, Link2, ChevronRight, XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ALERT_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  medical: { label: "مساعدة طبية", icon: "🏥", color: "text-red-600 bg-red-50 border-red-200" },
  lost: { label: "مفقود / ضائع", icon: "🧭", color: "text-amber-600 bg-amber-50 border-amber-200" },
  danger: { label: "خطر / طارئ", icon: "⚠️", color: "text-red-700 bg-red-50 border-red-300" },
  sos: { label: "استغاثة", icon: "🆘", color: "text-red-600 bg-red-50 border-red-200" },
  general: { label: "مساعدة عامة", icon: "🙏", color: "text-blue-600 bg-blue-50 border-blue-200" },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `منذ ${diffHr} ساعة`;
  return `منذ ${Math.floor(diffHr / 24)} يوم`;
}

function isOnline(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 5 * 60 * 1000;
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} م`;
  return `${(meters / 1000).toFixed(1)} كم`;
}

function extractInviteCode(input: string): string {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/[?&]join=([A-Za-z0-9]{3,8})/);
  if (urlMatch) return urlMatch[1].toUpperCase();
  const codeOnly = trimmed.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return codeOnly.length >= 3 ? codeOnly : trimmed.toUpperCase();
}

/* ═══════════════════════════════════════
   NO GROUP — Join or Create
   ═══════════════════════════════════════ */
function NoGroupView() {
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [location] = useLocation();
  const [groupLink, setGroupLink] = useState("");
  const [groupName, setGroupName] = useState("");
  const [mode, setMode] = useState<"join" | "create">("join");

  const joinGroup = useJoinGroup();
  const createGroup = useCreateGroup();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get("join");
    if (joinCode) {
      setGroupLink(joinCode);
      setMode("join");
    }
  }, [location]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = extractInviteCode(groupLink);
    if (!code || code.length < 3) return;
    joinGroup.mutate(
      { data: { inviteCode: code } },
      {
        onSuccess: async () => {
          toast({ title: "تم الانضمام للمجموعة بنجاح" });
          await refreshUser();
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "رمز الدعوة غير صحيح";
          toast({ title: msg, variant: "destructive" });
        },
      }
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    createGroup.mutate(
      { data: { nameAr: groupName.trim() } },
      {
        onSuccess: async () => {
          toast({ title: "تم إنشاء المجموعة بنجاح" });
          await refreshUser();
        },
      }
    );
  };

  return (
    <AppLayout title="مجموعتي">
      <div className="p-4 flex flex-col items-center pt-8">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-scale-in">
          <Users className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">لست منضماً لأي مجموعة</h2>
        <p className="text-muted-foreground text-center mb-8 max-w-xs leading-relaxed">
          المجموعة تساعدك على تتبع مواقع رفاقك واستقبال تنبيهات الطوارئ منهم
        </p>

        {/* Mode Toggle */}
        <div className="flex w-full max-w-sm overflow-hidden rounded-xl bg-surface p-1 shadow-card mb-6">
          <button
            type="button"
            onClick={() => setMode("join")}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-300",
              mode === "join" ? "bg-primary text-white shadow-sm" : "text-muted-foreground",
            )}
          >
            الانضمام لمجموعة
          </button>
          <button
            type="button"
            onClick={() => setMode("create")}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-300",
              mode === "create" ? "bg-primary text-white shadow-sm" : "text-muted-foreground",
            )}
          >
            إنشاء مجموعة
          </button>
        </div>

        {mode === "join" ? (
          <Card className="w-full max-w-sm animate-slide-up">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">انضم عبر الرابط أو الرمز</h3>
                  <p className="text-xs text-muted-foreground">الصق رابط الدعوة أو رمز المجموعة</p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-muted-foreground">كيف تنضم؟</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold">١</span>
                  <span>اطلب من قائد المجموعة رابط الدعوة</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold">٢</span>
                  <span>الصق الرابط أو الرمز في الحقل أدناه</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold">٣</span>
                  <span>اضغط انضمام وستظهر المجموعة</span>
                </div>
              </div>

              <form onSubmit={handleJoin} className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder="الصق الرابط هنا... مثال: /group?join=ABC123"
                    value={groupLink}
                    onChange={(e) => setGroupLink(e.target.value)}
                    dir="ltr"
                    className="pr-10 font-mono text-sm"
                  />
                  {groupLink && (
                    <button
                      type="button"
                      onClick={() => setGroupLink("")}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {groupLink && (
                  <div className="bg-primary/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">رمز الدعوة المستخرج</p>
                    <p className="font-mono text-2xl font-bold tracking-widest text-primary" dir="ltr">
                      {extractInviteCode(groupLink)}
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={joinGroup.isPending || groupLink.length < 3}>
                  {joinGroup.isPending ? "جاري الانضمام..." : "انضمام للمجموعة"}
                  <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-sm animate-slide-up">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-bold">إنشاء مجموعة جديدة</h3>
                  <p className="text-xs text-muted-foreground">أنشئ مجموعة واحصل على رابط دعوة</p>
                </div>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  placeholder="اسم المجموعة"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  maxLength={50}
                />
                <Button type="submit" className="w-full" disabled={createGroup.isPending || !groupName.trim()}>
                  {createGroup.isPending ? "جاري الإنشاء..." : "إنشاء المجموعة"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

/* ═══════════════════════════════════════
   HAS GROUP — Full Group View
   ═══════════════════════════════════════ */
function GroupView({ groupId }: { groupId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [myLat, setMyLat] = useState<number | null>(null);
  const [myLng, setMyLng] = useState<number | null>(null);
  const [showAlertDetail, setShowAlertDetail] = useState<string | null>(null);
  const [showInviteCard, setShowInviteCard] = useState(false);

  const { data: group, isLoading: isGroupLoading, error: groupError } = useGetGroup(groupId);
  const { data: members, isLoading: isMembersLoading, refetch: refetchMembers } = useGetGroupMembers(groupId);
  const { data: liveLocations } = useGetGroupLiveLocations(groupId);
  const { data: emergencyAlerts, refetch: refetchAlerts } = useGetGroupEmergencyAlerts(groupId);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setMyLat(pos.coords.latitude); setMyLng(pos.coords.longitude); },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => { refetchAlerts(); }, 15000);
    return () => clearInterval(interval);
  }, [refetchAlerts]);

  const copyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode);
    toast({ title: "تم نسخ رمز الدعوة" });
  };

  const otherAlerts = (emergencyAlerts ?? []).filter(
    (a) => a.status === "active" && a.userId !== user?.id
  );

  if (groupError) return <NoGroupView />;

  const isLeader = group && (group as unknown as { isLeader?: boolean }).isLeader;

  return (
    <AppLayout title="مجموعتي">
      <div className="p-4 space-y-4 pb-6">

        {/* ── Group Header ── */}
        <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-10 -translate-x-10 pointer-events-none" />

          <CardContent className="p-6 relative z-10">
            {isGroupLoading ? (
              <Skeleton className="h-20 w-full bg-primary-foreground/20" />
            ) : group ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-2xl font-bold">{group.nameAr}</h2>
                  {isLeader && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gold/20 text-gold">
                      قائد
                    </span>
                  )}
                </div>
                <div className="flex items-center text-primary-foreground/80 text-sm mb-4">
                  <Users className="w-4 h-4 ml-1" />
                  <span>{group.memberCount} أعضاء</span>
                </div>

                <button
                  onClick={() => setShowInviteCard(!showInviteCard)}
                  className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-xl backdrop-blur-sm transition-colors text-right"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-primary-foreground/70 mb-1">رمز دعوة المجموعة</p>
                      <p className="font-mono text-xl font-bold tracking-widest" dir="ltr">{group.inviteCode}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-white/20 text-white rounded-full h-10 w-10"
                        onClick={(e) => { e.stopPropagation(); copyCode(); }}
                      >
                        <Copy className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </button>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* ── Invite Card (expandable) ── */}
        {showInviteCard && group && (
          <Card className="border-2 border-primary/30 animate-slide-up">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg">دعوة أعضاء جدد</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowInviteCard(false)}>
                  <LogOut className="w-4 h-4 rotate-180" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">١</span>
                  </div>
                  <p className="text-sm font-semibold">أرسل الرابط</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 break-all">
                  <p className="text-xs font-mono text-primary" dir="ltr">
                    {window.location.origin}{window.location.pathname}?join={group.inviteCode}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?join=${group.inviteCode}`);
                    toast({ title: "تم نسخ الرابط" });
                  }}
                >
                  <Share2 className="w-4 h-4 ml-2" />
                  نسخ الرابط
                </Button>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs font-bold">٢</span>
                  </div>
                  <p className="text-sm font-semibold">أو شارك الرمز</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="font-mono text-3xl font-bold tracking-widest text-primary" dir="ltr">
                    {group.inviteCode}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(group.inviteCode);
                    toast({ title: "تم نسخ الرمز" });
                  }}
                >
                  <Copy className="w-4 h-4 ml-2" />
                  نسخ الرمز
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center pt-1">
                عند فتح الرابط ينضم الشخص تلقائياً لمجموعتك
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Emergency Alerts from OTHER members ── */}
        {otherAlerts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <div className="h-px flex-1 bg-destructive/30" />
              <span className="text-xs font-bold text-destructive bg-destructive/10 px-3 py-1 rounded-full flex items-center gap-1">
                <Bell className="w-3 h-3" />
                تنبيهات من الأعضاء ({otherAlerts.length})
              </span>
              <div className="h-px flex-1 bg-destructive/30" />
            </div>

            {otherAlerts.map((alert) => {
              const cfg = ALERT_TYPE_CONFIG[alert.alertType] ?? ALERT_TYPE_CONFIG.sos;
              return (
                <Card
                  key={alert.id}
                  className={cn("border-2 border-destructive/30 overflow-hidden animate-slide-up", showAlertDetail === alert.id && "ring-2 ring-destructive")}
                >
                  <CardContent className="p-0">
                    <button
                      className="w-full p-4 text-right"
                      onClick={() => setShowAlertDetail(showAlertDetail === alert.id ? null : alert.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0", cfg.color)}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <span className="text-xs text-muted-foreground">{timeAgo(alert.createdAt)}</span>
                            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", cfg.color)}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="font-bold text-sm">{alert.user?.fullNameAr ?? "عضو"}</p>
                          {alert.latitude && alert.longitude && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                              <MapPin className="w-3 h-3" />
                              <span>موقع محدد</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>

                    {showAlertDetail === alert.id && (
                      <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                        {alert.message && (
                          <div className="bg-muted/50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="w-4 h-4 text-primary" />
                              <span className="text-xs font-bold text-primary">ما يحتاجه العضو</span>
                            </div>
                            <p className="text-sm leading-relaxed">{alert.message}</p>
                          </div>
                        )}

                        {alert.latitude && alert.longitude && myLat && myLng && (
                          <div className="bg-primary/5 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">المسافة منك</p>
                                <p className="text-lg font-bold text-primary">
                                  {formatDistance(calcDistance(myLat, myLng, alert.latitude, alert.longitude))}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                className="bg-primary"
                                onClick={() => window.open(`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`, "_blank")}
                              >
                                <Navigation className="w-4 h-4 ml-1" />
                                توجيه
                              </Button>
                            </div>
                          </div>
                        )}

                        {alert.user?.phone && (
                          <a
                            href={`tel:${alert.user.phone}`}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            اتصال بـ {alert.user.fullNameAr}
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Members List ── */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-semibold text-lg">الأعضاء</h3>
            <Button variant="ghost" size="sm" className="text-primary text-xs" onClick={() => { refetchMembers(); refetchAlerts(); }}>
              تحديث
            </Button>
          </div>

          <div className="space-y-3">
            {isMembersLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))
            ) : members && members.length > 0 ? (
              members.map((member) => {
                const loc = liveLocations?.find((l) => l.userId === member.id);
                const online = isOnline(member.lastSeenAt ?? loc?.recordedAt ?? null);
                let distance: number | null = null;
                if (loc && myLat && myLng) {
                  distance = calcDistance(myLat, myLng, loc.latitude, loc.longitude);
                }
                const isMe = member.id === user?.id;

                return (
                  <Card key={member.id} className={cn("border-border shadow-sm", isMe && "bg-primary/5 border-primary/20")}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center",
                            isMe ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
                          )}>
                            <span className="font-bold text-lg">{member.fullNameAr.charAt(0)}</span>
                          </div>
                          <div className={cn(
                            "absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full",
                            online ? "bg-green-500" : "bg-gray-400"
                          )} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 justify-end">
                            {member.isLeader && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gold/10 text-gold">قائد</span>
                            )}
                            <h4 className="font-semibold text-sm">
                              {member.fullNameAr} {isMe ? "(أنت)" : ""}
                            </h4>
                          </div>

                          <div className="flex items-center gap-3 mt-1">
                            <a href={`tel:${member.phone}`} className="text-xs text-muted-foreground flex items-center hover:text-primary transition-colors">
                              <Phone className="w-3 h-3 ml-1" />
                              <span dir="ltr">{member.phone}</span>
                            </a>
                            {member.tentZone && (
                              <span className="text-xs text-muted-foreground">📍 {member.tentZone}</span>
                            )}
                          </div>

                          {loc?.recordedAt && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>آخر ظهور: {timeAgo(loc.recordedAt)}</span>
                            </div>
                          )}

                          {distance !== null && !isMe && (
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-primary font-medium">
                              <MapPin className="w-3 h-3" />
                              <span>يبعد {formatDistance(distance)}</span>
                            </div>
                          )}
                        </div>

                        {!isMe && loc && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-primary/10 hover:text-primary shrink-0"
                            onClick={() => window.open(`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`, "_blank")}
                          >
                            <Navigation className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : null}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function GroupPage() {
  const { user } = useAuth();

  if (!user?.groupId) {
    return <NoGroupView />;
  }

  return <GroupView groupId={user.groupId} />;
}
