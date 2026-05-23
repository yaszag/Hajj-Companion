import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  getActiveKhatma,
  getSurahs,
  createKhatma,
  logKhatmaReading,
  cancelKhatma,
  getKhatmaLogs,
  undoKhatmaLog,
  type Surah,
  type KhatmaLog,
} from "@/lib/api-client";
import { ApiError } from "@workspace/api-client-react";
import {
  BookOpen,
  Calendar,
  Target,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Plus,
  ArrowLeft,
  XCircle,
  History,
  Undo2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KhatmaPlanWithStats {
  id: string;
  name: string;
  status: string;
  totalAyat: number;
  targetDays: number;
  startDate: string;
  endDate: string;
  currentSurahId: number;
  currentAyah: number;
  totalAyatRead: number;
  completedAt: string | null;
  createdAt: string;
  dailyTarget: number;
  daysRemaining: number;
  progressPercent: number;
  statusMessage: string;
  currentSurahName: string;
  currentJuz: number;
  todayAyatRead: number;
  todayTarget: number;
  todayJuzRead: number;
  dailyJuzTarget: number;
}

/* ═══════════════════════════════════════
   PLAN SETUP
   ═══════════════════════════════════════ */
function SetupView({ onCreate }: { onCreate: (name: string, days: number) => void }) {
  const [name, setName] = useState("ختمة القرآن");
  const [days, setDays] = useState(7);
  const presets = [
    { label: "٧ أيام", value: 7, desc: "~891 آية/يوم" },
    { label: "١٤ يوم", value: 14, desc: "~445 آية/يوم" },
    { label: "٣٠ يوم", value: 30, desc: "~208 آية/يوم" },
    { label: "٦٠ يوم", value: 60, desc: "~104 آية/يوم" },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="text-center pt-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">ختمة القرآن الكريم</h2>
        <p className="text-muted-foreground text-sm">
          حدد هدفك وابدأ رحلتك مع كتاب الله
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">اسم الختمة</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-semibold mb-3 block">المدة</label>
            <div className="grid grid-cols-2 gap-3">
              {presets.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setDays(p.value)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    days === p.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <p className="font-bold text-lg">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">أو أدخل عدد أيام مخصص</label>
            <Input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 1)}
            />
          </div>

          <Button
            className="w-full h-12 text-lg"
            onClick={() => onCreate(name, days)}
          >
            <BookOpen className="w-5 h-5 ml-2" />
            ابدأ الختمة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════
   LOG HISTORY VIEW
   ═══════════════════════════════════════ */
function LogHistoryView({
  logs,
  surahs,
  onUndo,
  onBack,
}: {
  logs: KhatmaLog[];
  surahs: Surah[];
  onUndo: (logId: string) => void;
  onBack: () => void;
}) {
  const getSurahName = (id: number) => surahs.find((s) => s.id === id)?.nameAr || "";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h3 className="font-bold text-lg flex items-center gap-2">
          <History className="w-5 h-5" />
          سجل القراءة
        </h3>
      </div>

      {logs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <History className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>لا توجد تسجيلات بعد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {[...logs].reverse().map((log) => {
            const startSurah = getSurahName(log.startSurahId);
            const endSurah = getSurahName(log.endSurahId);
            const isBackward = log.ayatRead < 0;

            return (
              <Card key={log.id} className={cn(
                "hover-elevate",
                isBackward && "border-amber-200 bg-amber-50/50"
              )}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        isBackward
                          ? "bg-amber-100 text-amber-700"
                          : "bg-primary/10 text-primary"
                      )}>
                        {log.ayatRead > 0 ? `+${log.ayatRead}` : `${log.ayatRead}`} آية
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleDateString("ar-SA", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {startSurah}:{log.startAyah} ← {endSurah}:{log.endAyah}
                    </p>
                    {log.note && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">{log.note}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onUndo(log.id)}
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   ACTIVE PLAN TRACKER
   ═══════════════════════════════════════ */
function TrackerView({
  plan,
  surahs,
  onLog,
  onCancel,
  onViewHistory,
}: {
  plan: KhatmaPlanWithStats;
  surahs: Surah[];
  onLog: (ayatRead: number, endSurahId: number, endAyah: number, note?: string) => void;
  onCancel: () => void;
  onViewHistory: () => void;
}) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [ayatRead, setAyatRead] = useState(10);
  const [endSurahId, setEndSurahId] = useState(plan.currentSurahId);
  const [endAyah, setEndAyah] = useState(plan.currentAyah);
  const [note, setNote] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Sync form position when plan updates (after logging)
  useEffect(() => {
    setEndSurahId(plan.currentSurahId);
    setEndAyah(plan.currentAyah);
  }, [plan.currentSurahId, plan.currentAyah]);

  const currentSurah = surahs.find((s) => s.id === plan.currentSurahId);
  const statusMsg = plan.statusMessage || "";
  const isBehind = statusMsg.includes("متأخر");
  const isAhead = statusMsg.includes("متقدم");

  const handleLog = () => {
    onLog(ayatRead, endSurahId, endAyah, note || undefined);
    setShowLogForm(false);
    setAyatRead(10);
    setNote("");
  };

  const handleQuickLog = (count: number) => {
    const surah = surahs.find((s) => s.id === endSurahId);
    const maxAyah = surah?.ayatCount || 1;
    const newAyah = Math.min(plan.currentAyah + count, maxAyah);
    onLog(count, endSurahId, newAyah);
  };

  if (showCancelConfirm) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setShowCancelConfirm(false)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="font-bold text-lg">إلغاء الختمة</h3>
        </div>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 text-center space-y-4">
            <XCircle className="w-12 h-12 mx-auto text-destructive" />
            <div>
              <p className="font-bold text-lg">هل أنت متأكد؟</p>
              <p className="text-sm text-muted-foreground mt-1">
                سيتم إلغاء الختمة الحالية وستفقد كل التقدم. يمكنك بدء ختمة جديدة بعد ذلك.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelConfirm(false)}
              >
                تراجع
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={onCancel}
              >
                نعم، ألغِ الختمة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showLogForm) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setShowLogForm(false)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="font-bold text-lg">تسجيل القراءة</h3>
        </div>

        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">السورة الحالية</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={endSurahId}
                onChange={(e) => {
                  setEndSurahId(parseInt(e.target.value));
                  setEndAyah(1);
                }}
              >
                {surahs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameAr} ({s.ayatCount} آية)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">الآية</label>
              <Input
                type="number"
                min={1}
                max={surahs.find((s) => s.id === endSurahId)?.ayatCount || 1}
                value={endAyah}
                onChange={(e) => setEndAyah(parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">ملاحظة (اختياري)</label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: بعد صلاة الفجر" />
            </div>

            <Button className="w-full h-12" onClick={handleLog}>
              <CheckCircle2 className="w-5 h-5 ml-2" />
              تسجيل
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Progress Card */}
      <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <p className="text-sm text-primary-foreground/70 flex items-center gap-1 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                {plan.daysRemaining} أيام متبقية
              </p>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold">{plan.progressPercent}%</p>
            </div>
          </div>

          <Progress
            value={plan.progressPercent}
            className="h-3 w-full bg-white/20"
          />

          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-primary-foreground/70">
              {plan.totalAyatRead.toLocaleString()} / {plan.totalAyat.toLocaleString()} آية
            </span>
            <span className="text-primary-foreground/70">
              الجزء {plan.currentJuz}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Status Message */}
      <Card className={cn(
        "border-2",
        isBehind ? "border-amber-200 bg-amber-50" :
        isAhead ? "border-green-200 bg-green-50" :
        "border-primary/20 bg-primary/5"
      )}>
        <CardContent className="p-4 flex items-center gap-3">
          {isBehind ? (
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
          ) : isAhead ? (
            <TrendingUp className="w-6 h-6 text-green-600 shrink-0" />
          ) : (
            <Target className="w-6 h-6 text-primary shrink-0" />
          )}
          <div>
            <p className={cn(
              "font-bold text-sm",
              isBehind ? "text-amber-700" :
              isAhead ? "text-green-700" :
              "text-primary"
            )}>
              {plan.statusMessage}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              الهدف اليومي: {plan.dailyJuzTarget} جزء · قرأت اليوم: {plan.todayJuzRead} جزء
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Position */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">أنت الآن في</p>
              <p className="font-bold text-lg font-dua">
                سورة {currentSurah?.nameAr} — الآية {plan.currentAyah}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button className="h-12" onClick={() => setShowLogForm(true)}>
          <Plus className="w-5 h-5 ml-2" />
          سجّل قراءة
        </Button>
        <Button variant="outline" className="h-12" onClick={onViewHistory}>
          <History className="w-5 h-5 ml-2" />
          السجل
        </Button>
      </div>

      {/* Quick Add Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {[10, 25, 50].map((count) => (
          <Button
            key={count}
            variant="outline"
            className="h-12"
            onClick={() => handleQuickLog(count)}
          >
            +{count} آية
          </Button>
        ))}
      </div>

      {/* Cancel Button */}
      <Button
        variant="ghost"
        className="w-full text-muted-foreground hover:text-destructive"
        onClick={() => setShowCancelConfirm(true)}
      >
        <XCircle className="w-4 h-4 ml-2" />
        إلغاء الختمة
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════
   COMPLETED VIEW
   ═══════════════════════════════════════ */
function CompletedView({ plan, onStartNew }: { plan: KhatmaPlanWithStats; onStartNew: () => void }) {
  return (
    <div className="p-4 flex flex-col items-center pt-8">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-scale-in">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold mb-2">ما شاء الله!</h2>
      <p className="text-muted-foreground text-center mb-6">
        أتممت {plan.name} في {plan.targetDays} يوماً
      </p>
      <Card className="w-full max-w-sm mb-6">
        <CardContent className="p-5 text-center space-y-2">
          <p className="text-4xl font-bold text-primary">{plan.totalAyat.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">آية مقروءة</p>
        </CardContent>
      </Card>
      <Button className="w-full max-w-sm h-12" onClick={onStartNew}>
        <BookOpen className="w-5 h-5 ml-2" />
        بدء ختمة جديدة
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
type PageView = "setup" | "tracker" | "completed" | "history";

export default function KhatmaPage() {
  const { toast } = useToast();
  const [view, setView] = useState<PageView>("tracker");
  const [plan, setPlan] = useState<KhatmaPlanWithStats | null>(null);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [logs, setLogs] = useState<KhatmaLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    try {
      const data = await getActiveKhatma();
      if (data) {
        setPlan(data);
        if (data.status === "completed") {
          setView("completed");
        } else {
          setView("tracker");
        }
      } else {
        setPlan(null);
        setView("setup");
      }
    } catch {
      setPlan(null);
      setView("setup");
    }
  }, []);

  const fetchSurahs = useCallback(async () => {
    try {
      const data = await getSurahs();
      if (data) setSurahs(data);
    } catch { /* ignore */ }
  }, []);

  const fetchLogs = useCallback(async (planId: string) => {
    try {
      const data = await getKhatmaLogs(planId);
      if (data) setLogs(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchPlan(), fetchSurahs()]).finally(() => setIsLoading(false));
  }, [fetchPlan, fetchSurahs]);

  useEffect(() => {
    if (plan && view === "history") {
      fetchLogs(plan.id);
    }
  }, [plan, view, fetchLogs]);

  const handleCreate = async (name: string, days: number) => {
    try {
      const data = await createKhatma(name, days);
      setPlan(data);
      setView("tracker");
      toast({ title: "تم إنشاء الختمة" });
    } catch (err: unknown) {
      const message = err instanceof ApiError && err.data ? (err.data as Record<string, unknown>).error as string | undefined : undefined;
      toast({ title: message || "حدث خطأ", variant: "destructive" });
    }
  };

  const handleLog = async (ayatRead: number, endSurahId: number, endAyah: number, note?: string) => {
    if (!plan) return;
    try {
      await logKhatmaReading(plan.id, ayatRead, endSurahId, endAyah, note);
      await fetchPlan();
      toast({ title: "تم تسجيل القراءة" });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const handleCancel = async () => {
    if (!plan) return;
    try {
      await cancelKhatma(plan.id);
      setPlan(null);
      setView("setup");
      toast({ title: "تم إلغاء الختمة" });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const handleUndoLog = async (logId: string) => {
    if (!plan) return;
    try {
      await undoKhatmaLog(plan.id, logId);
      await fetchPlan();
      await fetchLogs(plan.id);
      toast({ title: "تم التراجع عن التسجيل" });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const handleStartNew = () => {
    setPlan(null);
    setView("setup");
  };

  if (isLoading) {
    return (
      <AppLayout title="ختمة القرآن">
        <div className="p-4 space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (view === "setup" || !plan) {
    return (
      <AppLayout title="ختمة القرآن">
        <SetupView onCreate={handleCreate} />
      </AppLayout>
    );
  }

  if (view === "completed") {
    return (
      <AppLayout title="ختمة القرآن">
        <CompletedView plan={plan} onStartNew={handleStartNew} />
      </AppLayout>
    );
  }

  if (view === "history") {
    return (
      <AppLayout title="ختمة القرآن">
        <LogHistoryView
          logs={logs}
          surahs={surahs}
          onUndo={handleUndoLog}
          onBack={() => setView("tracker")}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="ختمة القرآن">
      <TrackerView
        plan={plan}
        surahs={surahs}
        onLog={handleLog}
        onCancel={handleCancel}
        onViewHistory={() => setView("history")}
      />
    </AppLayout>
  );
}
