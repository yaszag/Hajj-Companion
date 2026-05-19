import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  ChevronRight,
  Calendar,
  Target,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Plus,
  ArrowLeft,
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
}

interface Surah {
  id: number;
  nameAr: string;
  nameEn: string;
  ayatCount: number;
  revelationType: string;
  juzStart: number;
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
   ACTIVE PLAN TRACKER
   ═══════════════════════════════════════ */
function TrackerView({
  plan,
  surahs,
  onLog,
}: {
  plan: KhatmaPlanWithStats;
  surahs: Surah[];
  onLog: (ayatRead: number, endSurahId: number, endAyah: number, note?: string) => void;
}) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [ayatRead, setAyatRead] = useState(10);
  const [endSurahId, setEndSurahId] = useState(plan.currentSurahId);
  const [endAyah, setEndAyah] = useState(plan.currentAyah);
  const [note, setNote] = useState("");

  const currentSurah = surahs.find((s) => s.id === plan.currentSurahId);
  const statusMsg = plan.statusMessage || "";
  const isBehind = statusMsg.includes("متأخر");
  const isAhead = statusMsg.includes("متقدم");
  const isOnTrack = !isBehind && !isAhead;

  const handleLog = () => {
    onLog(ayatRead, endSurahId, endAyah, note || undefined);
    setShowLogForm(false);
    setAyatRead(10);
    setNote("");
  };

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
              <label className="text-sm font-semibold mb-2 block">عدد الآيات المقروءة</label>
              <Input
                type="number"
                min={1}
                value={ayatRead}
                onChange={(e) => setAyatRead(parseInt(e.target.value) || 1)}
              />
            </div>

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
      {/* Progress Ring Card */}
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
              الهدف اليومي: {plan.todayTarget} آية · قرأت اليوم: {plan.todayAyatRead}
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

      {/* Quick Log */}
      <div className="flex gap-3">
        <Button className="flex-1 h-12" onClick={() => setShowLogForm(true)}>
          <Plus className="w-5 h-5 ml-2" />
          سجّل قراءة
        </Button>
      </div>

      {/* Quick Add Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {[10, 25, 50].map((count) => (
          <Button
            key={count}
            variant="outline"
            className="h-12"
            onClick={() => {
              const surah = surahs.find((s) => s.id === endSurahId);
              const newAyah = Math.min(plan.currentAyah + count, surah?.ayatCount || 1);
              onLog(count, endSurahId, newAyah);
            }}
          >
            +{count} آية
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   COMPLETED VIEW
   ═══════════════════════════════════════ */
function CompletedView({ plan }: { plan: KhatmaPlanWithStats }) {
  return (
    <div className="p-4 flex flex-col items-center pt-8">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-scale-in">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold mb-2">ما شاء الله!</h2>
      <p className="text-muted-foreground text-center mb-6">
        أتممت {plan.name} في {plan.targetDays} يوماً
      </p>
      <Card className="w-full max-w-sm">
        <CardContent className="p-5 text-center space-y-2">
          <p className="text-4xl font-bold text-primary">{plan.totalAyat.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">آية مقروءة</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function KhatmaPage() {
  const { toast } = useToast();
  const [plan, setPlan] = useState<KhatmaPlanWithStats | null>(null);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch("/api/khatma/active", {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      if (res.ok) setPlan(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchSurahs = useCallback(async () => {
    try {
      const res = await fetch("/api/quran/surahs", {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      if (res.ok) setSurahs(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchPlan(), fetchSurahs()]).finally(() => setIsLoading(false));
  }, [fetchPlan, fetchSurahs]);

  const handleCreate = async (name: string, days: number) => {
    try {
      const res = await fetch("/api/khatma", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ name, targetDays: days }),
      });
      if (res.ok) {
        setPlan(await res.json());
        toast({ title: "تم إنشاء الختمة" });
      } else {
        const data = await res.json();
        toast({ title: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const handleLog = async (ayatRead: number, endSurahId: number, endAyah: number, note?: string) => {
    if (!plan) return;
    try {
      const res = await fetch(`/api/khatma/${plan.id}/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ ayatRead, endSurahId, endAyah, note }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPlan(updated);
        toast({ title: "تم تسجيل القراءة" });
      }
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
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

  if (!plan) {
    return (
      <AppLayout title="ختمة القرآن">
        <SetupView onCreate={handleCreate} />
      </AppLayout>
    );
  }

  if (plan.status === "completed") {
    return (
      <AppLayout title="ختمة القرآن">
        <CompletedView plan={plan} />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="ختمة القرآن">
      <TrackerView
        plan={plan}
        surahs={surahs}
        onLog={handleLog}
      />
    </AppLayout>
  );
}
