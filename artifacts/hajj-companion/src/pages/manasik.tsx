import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetManasik, useUpdateManasikProgress, type ManasikItem } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, Clock, RotateCcw, ChevronDown, ChevronUp, AlertTriangle, Info, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type ManasikCategory = "rukn" | "wajib" | "sunnah";
type ManasikStatus = "pending" | "in_progress" | "completed";

const CATEGORY_CONFIG = {
  rukn:   { label: "ركن",  color: "#E24B4A", bg: "bg-red-50",   border: "border-l-[#E24B4A]",  icon: AlertTriangle },
  wajib:  { label: "واجب", color: "#EF9F27", bg: "bg-amber-50", border: "border-l-[#EF9F27]",  icon: Info },
  sunnah: { label: "سنة",  color: "#1D9E75", bg: "bg-green-50", border: "border-l-[#1D9E75]",  icon: Sparkles },
};

const NUSUK_LABELS = { ifrad: "الإفراد", tamattu: "التمتع", qiran: "القران" };

export default function ManasikPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: manasikItems, isLoading, refetch } = useGetManasik();
  const updateProgress = useUpdateManasikProgress();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const nusukType = (user as (typeof user & { nusukType?: string | null }) | null)?.nusukType;

  const handleUpdateStatus = (key: string, targetStatus: ManasikStatus) => {
    updateProgress.mutate(
      { key, data: { status: targetStatus } },
      {
        onSuccess: () => refetch(),
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  const getStatusIcon = (status: ManasikStatus) => {
    if (status === "completed") return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    if (status === "in_progress") return <Clock className="w-6 h-6 text-amber-500" />;
    return <Circle className="w-6 h-6 text-muted-foreground" />;
  };

  const getNextStatus = (status: ManasikStatus): ManasikStatus | null => {
    if (status === "pending") return "in_progress";
    if (status === "in_progress") return "completed";
    return null;
  };

  const getNextLabel = (status: ManasikStatus): string => {
    if (status === "pending") return "بدء";
    if (status === "in_progress") return "إتمام";
    return "";
  };

  if (isLoading) {
    return (
      <AppLayout title="مناسكي">
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      </AppLayout>
    );
  }

  const sorted = [...(manasikItems ?? [])].sort((a, b) => {
    // Sort by order, but within same day: rukn first
    const dayDiff = (a.day ?? 0) - (b.day ?? 0);
    if (dayDiff !== 0) return dayDiff;
    const catOrder: Record<string, number> = { rukn: 0, wajib: 1, sunnah: 2 };
    const catA = catOrder[(a as ManasikItem & { category?: string }).category ?? "wajib"] ?? 1;
    const catB = catOrder[(b as ManasikItem & { category?: string }).category ?? "wajib"] ?? 1;
    return catA - catB || a.order - b.order;
  });

  const completed = sorted.filter((i) => i.status === "completed").length;
  const total = sorted.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <AppLayout title="مناسكي">
      <div className="p-4 space-y-4 pb-6">
        {/* Header: nusuk type + progress */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              className="text-xs text-primary font-medium underline underline-offset-2"
              onClick={() => setLocation("/nusuk-select")}
            >
              {nusukType ? NUSUK_LABELS[nusukType as keyof typeof NUSUK_LABELS] : "اختر نوع نسكك →"}
            </button>
            <div className="text-right">
              <p className="text-sm font-semibold">{completed} / {total} مكتمل</p>
              <p className="text-xs text-muted-foreground">الإنجاز {pct}%</p>
            </div>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Manasik list */}
        {sorted.map((item) => {
          const typed = item as ManasikItem & {
            category?: ManasikCategory;
            steps?: { title: string; detail: string; category: ManasikCategory }[];
            commonMistakes?: { wrong: string; right: string }[];
            malikirNote?: string;
            practicalTip?: string;
          };
          const cfg = CATEGORY_CONFIG[typed.category ?? "wajib"];
          const isExpanded = expandedKey === item.key;
          const nextStatus = getNextStatus(item.status as ManasikStatus);

          return (
            <Card
              key={item.key}
              className={`border-l-4 transition-all ${cfg.border} ${
                item.status === "completed" ? "opacity-75" : ""
              }`}
            >
              <CardContent className="p-0">
                {/* Main row */}
                <button
                  className="w-full p-4 text-right flex items-center gap-3 hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedKey(isExpanded ? null : item.key)}
                >
                  <div className="shrink-0">{getStatusIcon(item.status as ManasikStatus)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                        style={{ backgroundColor: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      <h3
                        className={`font-semibold text-sm truncate ${
                          item.status === "completed" ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {item.titleAr}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 text-right">
                      اليوم {item.day} • {item.descriptionAr}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-3">
                    {/* Category warning box */}
                    {typed.category === "rukn" && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-right">
                        <p className="text-xs text-red-700 font-bold">⚠️ هذا ركن — تركه يبطل الحج ولا يجبره دم</p>
                      </div>
                    )}
                    {typed.category === "wajib" && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-right">
                        <p className="text-xs text-amber-700 font-bold">ℹ️ هذا واجب — تركه عمداً يوجب الفدية</p>
                      </div>
                    )}
                    {typed.category === "sunnah" && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-right">
                        <p className="text-xs text-green-700 font-bold">🌟 سنة — يستحب فعلها وتركها لا يبطل الحج</p>
                      </div>
                    )}

                    {/* Steps */}
                    {typed.steps && typed.steps.length > 0 && (
                      <div className="text-right">
                        <p className="text-xs font-bold text-muted-foreground mb-2">خطوات الأداء</p>
                        <div className="space-y-2">
                          {typed.steps.map((step, i) => {
                            const dot = step.category === "rukn" ? "🔴" : step.category === "wajib" ? "🟠" : "🟢";
                            return (
                              <div key={i} className="flex items-start gap-2 text-right">
                                <span className="text-base shrink-0 mt-0.5">{dot}</span>
                                <div>
                                  <p className="text-sm font-semibold">{step.title}</p>
                                  <p className="text-xs text-muted-foreground leading-relaxed">{step.detail}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Maliki Note */}
                    {typed.malikirNote && (
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-right">
                        <p className="text-xs font-bold text-primary mb-1">🔖 المذهب المالكي</p>
                        <p className="text-xs text-foreground/80 leading-relaxed">{typed.malikirNote}</p>
                      </div>
                    )}

                    {/* Common Mistakes */}
                    {typed.commonMistakes && typed.commonMistakes.length > 0 && (
                      <div className="text-right">
                        <p className="text-xs font-bold text-muted-foreground mb-2">الأخطاء الشائعة</p>
                        <div className="space-y-2">
                          {typed.commonMistakes.map((m, i) => (
                            <div key={i} className="bg-card border border-border rounded-xl p-3 space-y-1">
                              <p className="text-xs text-red-600">❌ {m.wrong}</p>
                              <p className="text-xs text-green-600">✅ {m.right}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Practical tip */}
                    {typed.practicalTip && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-right">
                        <p className="text-xs text-blue-700 leading-relaxed">💡 {typed.practicalTip}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-row-reverse">
                      {nextStatus && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleUpdateStatus(item.key, nextStatus)}
                          disabled={updateProgress.isPending}
                        >
                          {getNextLabel(item.status as ManasikStatus)}
                        </Button>
                      )}
                      {item.status !== "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-muted-foreground"
                          onClick={() => {
                            const prev: ManasikStatus = item.status === "completed" ? "in_progress" : "pending";
                            handleUpdateStatus(item.key, prev);
                          }}
                          disabled={updateProgress.isPending}
                        >
                          <RotateCcw className="w-3 h-3 ml-1" />
                          تراجع
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {!isLoading && sorted.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-4">🕌</p>
            <p>لا توجد مناسك حالياً</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
