import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  getArafahGoal,
  incrementArafahGoal,
  completeArafahGoal,
  type ArafahGoal,
} from "@/lib/api-client";
import { ArrowLeft, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";

export default function ArafahCounterPage() {
  const { goalId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [goal, setGoal] = useState<ArafahGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [showComplete, setShowComplete] = useState(false);
  const prevCount = useRef(0);

  const fetchGoal = useCallback(async () => {
    try {
      const g = await getArafahGoal(goalId!);
      setGoal(g);
      prevCount.current = g.currentCount;
    } catch {
      toast({ title: "الهدف غير موجود", variant: "destructive" });
      setLocation("/arafah");
    } finally {
      setLoading(false);
    }
  }, [goalId, setLocation, toast]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  const handleIncrement = async () => {
    if (!goal || goal.completed) return;
    const updated = await incrementArafahGoal(goal.id);
    setGoal(updated);
    setScale(0.92);
    setTimeout(() => setScale(1), 100);

    if (updated.completed && updated.currentCount > prevCount.current) {
      setShowComplete(true);
      setTimeout(() => setShowComplete(false), 2500);
    }
    prevCount.current = updated.currentCount;
  };

  const handleComplete = async () => {
    if (!goal || goal.completed) return;
    const updated = await completeArafahGoal(goal.id);
    setGoal(updated);
    setShowComplete(true);
    setTimeout(() => setShowComplete(false), 2500);
  };

  if (loading) {
    return (
      <AppLayout title="تسبيح">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!goal) return null;

  const progress = goal.targetValue > 0
    ? Math.min((goal.currentCount / goal.targetValue) * 100, 100)
    : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <AppLayout title={goal.titleAr || "تسبيح"}>
      <div className="flex flex-col items-center pt-4 pb-8 px-4 min-h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/arafah")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{goal.goalType === "tasbeeh" ? "تسبيح" : goal.goalType === "dua_read" ? "دعاء" : goal.goalType}</p>
          </div>
          {goal.targetType === "count" && !goal.completed && (
            <Button variant="ghost" size="icon" onClick={handleComplete}>
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </Button>
          )}
          {goal.completed && <div className="w-10" />}
        </div>

        {/* Arabic text */}
        {goal.arabicText && (
          <div className="text-center mb-6">
            <p className="text-2xl font-bold font-dua leading-relaxed" style={{ fontFamily: "'Noto Naskh Arabic', serif" }}>
              {goal.arabicText}
            </p>
          </div>
        )}

        {/* Title */}
        <h2 className="text-lg font-bold mb-2 text-center">{goal.titleAr}</h2>
        {goal.completed && (
          <div className="flex items-center gap-1.5 text-primary mb-4">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">مكتمل</span>
          </div>
        )}

        {/* Circular Counter */}
        {!goal.completed && goal.targetType === "count" && (
          <div className="relative mb-8 mt-4">
            <svg width="280" height="280" className="transform -rotate-90">
              <circle cx="140" cy="140" r="120" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
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
              onClick={handleIncrement}
              className="absolute inset-0 flex flex-col items-center justify-center select-none active:scale-95 transition-transform"
              style={{ transform: `scale(${scale})` }}
            >
              <span className="text-6xl font-bold text-primary tabular-nums">
                {goal.currentCount}
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                الهدف: {goal.targetValue}
              </span>
            </button>
          </div>
        )}

        {/* Completed state */}
        {goal.completed && (
          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <p className="text-lg font-bold text-primary">ما شاء الله! تم الإكمال</p>
            <Button onClick={() => setLocation("/arafah")}>العودة للخطة</Button>
          </div>
        )}

        {/* Completed animation overlay */}
        {showComplete && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-primary/90 text-white px-8 py-4 rounded-2xl shadow-2xl animate-scale-in">
              <Sparkles className="w-8 h-8 mx-auto mb-2" />
              <p className="text-lg font-bold">ما شاء الله!</p>
              <p className="text-sm opacity-90">{goal.completed ? "تم إكمال الهدف" : "تمت الإضافة"}</p>
            </div>
          </div>
        )}

        {/* Tap hint */}
        {!goal.completed && goal.targetType === "count" && (
          <p className="text-xs text-muted-foreground animate-pulse mt-auto">
            اضغط على الدائرة للتسبيح
          </p>
        )}
      </div>
    </AppLayout>
  );
}
