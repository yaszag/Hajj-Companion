import React, { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  RotateCcw,
  History,
  Sparkles,
  Moon,
  Sun,
  Sunset,
  Sunrise,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTasbihPresets, getActiveTasbih, selectTasbih, incrementTasbih, resetTasbihRound } from "@/lib/api-client";

interface TasbihPreset {
  id: string;
  phraseAr: string;
  transliteration: string | null;
  translationAr: string | null;
  meaning: string | null;
  recommendedCount: number;
  category: string;
  timeOfDay: string | null;
  spiritualNote: string | null;
  orderIndex: number;
  isFeatured: boolean;
}

interface TasbihSession {
  id: string;
  presetId: string;
  preset: TasbihPreset | null;
  targetCount: number;
  currentCount: number;
  roundsCompleted: number;
  totalCount: number;
  status: string;
  date: string;
  startedAt: string;
  completedAt: string | null;
}

interface DayStats {
  date: string;
  totalCount: number;
  roundsCompleted: number;
  sessionCount: number;
}

/* ═══════════════════════════════════════
   TASBIH COUNTER — Full Screen
   ═══════════════════════════════════════ */
function CounterView({
  session,
  onIncrement,
  onResetRound,
  onBack,
}: {
  session: TasbihSession;
  onIncrement: () => void;
  onResetRound: () => void;
  onBack: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [showComplete, setShowComplete] = useState(false);
  const prevCount = useRef(session.currentCount);

  useEffect(() => {
    if (session.currentCount > prevCount.current) {
      setScale(0.92);
      setTimeout(() => setScale(1), 100);
      prevCount.current = session.currentCount;

      if (session.currentCount >= session.targetCount && session.currentCount - prevCount.current <= 1) {
        setShowComplete(true);
        setTimeout(() => setShowComplete(false), 2000);
      }
    }
  }, [session.currentCount, session.targetCount]);

  const progress = Math.min((session.currentCount / session.targetCount) * 100, 100);
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center pt-4 pb-8 px-4 min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">{session.preset?.category}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onResetRound}>
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      {/* Phrase */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-dua leading-relaxed mb-2">
          {session.preset?.phraseAr}
        </h2>
        {session.preset?.transliteration && (
          <p className="text-sm text-muted-foreground">{session.preset.transliteration}</p>
        )}
      </div>

      {/* Circular Counter */}
      <div className="relative mb-8">
        <svg width="280" height="280" className="transform -rotate-90">
          <circle
            cx="140" cy="140" r="120"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <circle
            cx="140" cy="140" r="120"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-200"
          />
        </svg>
        <button
          onClick={onIncrement}
          className="absolute inset-0 flex flex-col items-center justify-center select-none active:scale-95 transition-transform"
          style={{ transform: `scale(${scale})` }}
        >
          <span className="text-6xl font-bold text-primary tabular-nums">
            {session.currentCount}
          </span>
          <span className="text-sm text-muted-foreground mt-1">
            الهدف: {session.targetCount}
          </span>
        </button>
      </div>

      {/* Round info */}
      <div className="flex items-center gap-6 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-gold">{session.roundsCompleted}</p>
          <p className="text-xs text-muted-foreground">جولات مكتملة</p>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{session.totalCount}</p>
          <p className="text-xs text-muted-foreground">إجمالي التسبيحات</p>
        </div>
      </div>

      {/* Tap hint */}
      <p className="text-xs text-muted-foreground animate-pulse">
        اضغط للتسبيح
      </p>

      {/* Complete animation */}
      {showComplete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-primary/90 text-white px-8 py-4 rounded-2xl shadow-2xl animate-scale-in">
            <Sparkles className="w-8 h-8 mx-auto mb-2" />
            <p className="text-lg font-bold">ما شاء الله!</p>
            <p className="text-sm opacity-90">أتممت الجولة</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   PRESET LIST
   ═══════════════════════════════════════ */
function PresetListView({
  presets,
  onSelect,
  isLoading,
}: {
  presets: TasbihPreset[];
  onSelect: (preset: TasbihPreset) => void;
  isLoading: boolean;
}) {
  const featured = presets.filter((p) => p.isFeatured);
  const others = presets.filter((p) => !p.isFeatured);

  return (
    <div className="p-4 space-y-6">
      {/* Featured */}
      <section>
        <h3 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          المفضلة
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))
            : featured.map((preset) => (
                <Card
                  key={preset.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors hover-elevate"
                  onClick={() => onSelect(preset)}
                >
                  <CardContent className="p-4 text-center">
                    <p className="text-lg font-bold font-dua leading-tight mb-1">{preset.phraseAr}</p>
                    <p className="text-xs text-muted-foreground">× {preset.recommendedCount}</p>
                  </CardContent>
                </Card>
              ))}
        </div>
      </section>

      {/* All */}
      <section>
        <h3 className="text-sm font-bold text-muted-foreground mb-3">جميع الأذكار</h3>
        <div className="space-y-2">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))
            : others.map((preset) => (
                <Card
                  key={preset.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors hover-elevate"
                  onClick={() => onSelect(preset)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold font-dua text-base">{preset.phraseAr}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{preset.category} · × {preset.recommendedCount}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">+</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function TasbihPage() {
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "counter">("list");
  const [session, setSession] = useState<TasbihSession | null>(null);
  const [presets, setPresets] = useState<TasbihPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCounterLoading, setIsCounterLoading] = useState(false);

  const fetchPresets = useCallback(async () => {
    try {
      const data = await getTasbihPresets();
      if (data) setPresets(data);
    } catch { /* ignore */ }
  }, []);

  const fetchActive = useCallback(async () => {
    try {
      const data = await getActiveTasbih();
      if (data) {
        setSession(data);
        setView("counter");
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchPresets(), fetchActive()]).finally(() => setIsLoading(false));
  }, [fetchPresets, fetchActive]);

  const handleSelect = async (preset: TasbihPreset) => {
    setIsCounterLoading(true);
    try {
      const data = await selectTasbih(preset.id);
      setSession(data);
      setView("counter");
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setIsCounterLoading(false);
    }
  };

  const handleIncrement = async () => {
    try {
      const data = await incrementTasbih();
      if (data) setSession(data);
    } catch { /* ignore */ }
  };

  const handleResetRound = async () => {
    try {
      const data = await resetTasbihRound();
      if (data) {
        setSession(data);
        toast({ title: "ما شاء الله! تم إكمال الجولة" });
      }
    } catch { /* ignore */ }
  };

  if (isCounterLoading) {
    return (
      <AppLayout title="تسبيح">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (view === "counter" && session) {
    return (
      <AppLayout title="تسبيح">
        <CounterView
          session={session}
          onIncrement={handleIncrement}
          onResetRound={handleResetRound}
          onBack={() => setView("list")}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="تسبيح">
      <PresetListView
        presets={presets}
        onSelect={handleSelect}
        isLoading={isLoading}
      />
    </AppLayout>
  );
}
