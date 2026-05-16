import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetManasik, useUpdateManasikProgress, type ManasikItem } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, Clock, RotateCcw, ChevronDown, ChevronUp, AlertTriangle, Info, Sparkles, Lightbulb, BookOpen, Heart, ShieldAlert, Quote, Timer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type ManasikCategory = "rukn" | "wajib" | "sunnah";
type ManasikStatus = "pending" | "in_progress" | "completed";

const CATEGORY_CONFIG = {
  rukn:   { label: "ركن",  color: "#E24B4A", bg: "bg-red-50",   border: "border-l-[#E24B4A]",  icon: AlertTriangle, ring: "ring-red-100" },
  wajib:  { label: "واجب", color: "#EF9F27", bg: "bg-amber-50", border: "border-l-[#EF9F27]",  icon: Info, ring: "ring-amber-100" },
  sunnah: { label: "سنة",  color: "#1D9E75", bg: "bg-green-50", border: "border-l-[#1D9E75]",  icon: Sparkles, ring: "ring-green-100" },
};

const NUSUK_LABELS = { ifrad: "الإفراد", tamattu: "التمتع", qiran: "القران" };

const DAY_LABELS: Record<number, string> = {
  0: "قبل يوم التروية",
  8: "يوم التروية",
  9: "يوم عرفة",
  10: "يوم النحر (العيد)",
  11: "أول أيام التشريق",
  12: "ثاني أيام التشريق",
  13: "ثالث أيام التشريق",
  99: "يوم المغادرة",
};

const DAY_ORDER = [0, 8, 9, 10, 11, 12, 13, 99];

export default function ManasikPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: manasikItems, isLoading, refetch } = useGetManasik();
  const updateProgress = useUpdateManasikProgress();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [isMutaajil, setIsMutaajil] = useState<boolean | null>(null);

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
    const dayDiff = (a.day ?? 0) - (b.day ?? 0);
    if (dayDiff !== 0) return dayDiff;
    return a.order - b.order;
  });

  const filtered = isMutaajil === true
    ? sorted.filter((item) => (item.day ?? 0) !== 13)
    : sorted;

  const groupedByDay = filtered.reduce<Record<number, typeof sorted>>((acc, item) => {
    const day = item.day ?? 0;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  const orderedDays = DAY_ORDER.filter((day) => groupedByDay[day] && groupedByDay[day].length > 0);

  const completed = sorted.filter((i) => i.status === "completed").length;
  const total = sorted.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const hasTashriqInData = sorted.some((item) => (item.day ?? 0) >= 11 && (item.day ?? 0) <= 13);

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

        {/* Manasik list grouped by day */}
        {orderedDays.map((day) => {
          const items = groupedByDay[day];
          const isDepartureDay = day === 99;
          const isDay10 = day === 10;

          return (
            <div key={day} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="h-px flex-1 bg-border" />
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isDepartureDay
                    ? "bg-gold/10 text-gold"
                    : "bg-primary/10 text-primary"
                }`}>
                  {isDepartureDay ? DAY_LABELS[day] : `اليوم ${day} — ${DAY_LABELS[day] ?? ""}`}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {items.map((item) => {
                const typed = item as ManasikItem & {
                  category?: ManasikCategory;
                  steps?: { title: string; detail: string; category: ManasikCategory }[];
                  commonMistakes?: { wrong: string; right: string }[];
                  malikirNote?: string;
                  practicalTip?: string;
                  importantAdvice?: string[];
                  keyDua?: string;
                };
                const cfg = CATEGORY_CONFIG[typed.category ?? "wajib"];
                const isExpanded = expandedKey === item.key;
                const nextStatus = getNextStatus(item.status as ManasikStatus);

                return (
                  <Card
                    key={item.key}
                    className={`border-l-4 transition-all duration-200 ${cfg.border} ${
                      item.status === "completed" ? "opacity-70" : ""
                    } ${isExpanded ? "shadow-md ring-1 " + cfg.ring : ""}`}
                  >
                    <CardContent className="p-0">
                      <button
                        className="w-full p-4 text-right flex items-center gap-3 hover:bg-muted/30 transition-colors rounded-t-2xl"
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
                            {item.descriptionAr}
                          </p>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
                          {typed.category === "rukn" && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-right flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                              <p className="text-xs text-red-700 font-bold">ركن — تركه يبطل الحج ولا يُجبره دم</p>
                            </div>
                          )}
                          {typed.category === "wajib" && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-right flex items-start gap-2">
                              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-700 font-bold">واجب — تركه عمداً يوجب الفدية (ذبح شاة)</p>
                            </div>
                          )}
                          {typed.category === "sunnah" && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-right flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                              <p className="text-xs text-green-700 font-bold">سنة — يستحب فعلها وتركها لا يبطل الحج</p>
                            </div>
                          )}

                          {typed.keyDua && (
                            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-right">
                              <div className="flex items-center gap-2 mb-2">
                                <Quote className="w-4 h-4 text-primary" />
                                <p className="text-xs font-bold text-primary">دعاء مستحب</p>
                              </div>
                              <p className="text-sm font-amiri leading-loose text-foreground/90">{typed.keyDua}</p>
                            </div>
                          )}

                          {typed.steps && typed.steps.length > 0 && (
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-3">
                                <BookOpen className="w-4 h-4 text-primary" />
                                <p className="text-xs font-bold text-primary">خطوات الأداء</p>
                              </div>
                              <div className="space-y-3">
                                {typed.steps.map((step, i) => {
                                  const dotColor = step.category === "rukn" ? "bg-red-500" : step.category === "wajib" ? "bg-amber-500" : "bg-green-500";
                                  return (
                                    <div key={i} className="flex items-start gap-3 text-right">
                                      <div className={`w-2 h-2 rounded-full ${dotColor} shrink-0 mt-2`} />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 justify-end">
                                          <p className="text-sm font-semibold">{step.title}</p>
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: CATEGORY_CONFIG[step.category].color }}>
                                            {CATEGORY_CONFIG[step.category].label}
                                          </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{step.detail}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {typed.importantAdvice && typed.importantAdvice.length > 0 && (
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-3">
                                <Heart className="w-4 h-4 text-red-500" />
                                <p className="text-xs font-bold text-red-600">نصائح مهمة</p>
                              </div>
                              <div className="space-y-2">
                                {typed.importantAdvice.map((advice, i) => (
                                  <div key={i} className="bg-surface2 rounded-xl p-3 text-right border border-border/50">
                                    <div className="flex items-start gap-2">
                                      <span className="text-primary font-bold text-xs shrink-0 mt-0.5">{i + 1}.</span>
                                      <p className="text-xs text-foreground/80 leading-relaxed">{advice}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {typed.malikirNote && (
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-right">
                              <p className="text-xs font-bold text-primary mb-1">🔖 المذهب المالكي</p>
                              <p className="text-xs text-foreground/80 leading-relaxed">{typed.malikirNote}</p>
                            </div>
                          )}

                          {typed.commonMistakes && typed.commonMistakes.length > 0 && (
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-3">
                                <ShieldAlert className="w-4 h-4 text-red-500" />
                                <p className="text-xs font-bold text-red-600">الأخطاء الشائعة</p>
                              </div>
                              <div className="space-y-2">
                                {typed.commonMistakes.map((m, i) => (
                                  <div key={i} className="bg-card border border-border rounded-xl p-3 space-y-1.5">
                                    <p className="text-xs text-red-600 font-medium">❌ {m.wrong}</p>
                                    <p className="text-xs text-green-600 font-medium">✅ {m.right}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {typed.practicalTip && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-right flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                              <p className="text-xs text-blue-700 leading-relaxed">{typed.practicalTip}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 flex-row-reverse pt-2">
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

              {/* Muta'ajil toggle — shown right after day 10 section */}
              {isDay10 && hasTashriqInData && (
                <div className="bg-card border border-primary/30 rounded-2xl p-4 mt-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-right flex-1">
                      <p className="text-sm font-semibold flex items-center gap-2 justify-end">
                        <Timer className="w-4 h-4 text-primary" />
                        هل أنت مُتَعَجِّل؟
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isMutaajil === null
                          ? "اختر إذا كنت ستغادر منى يوم ١٢ قبل الغروب"
                          : isMutaajil
                            ? "متعجِّل — يومان فقط (١١ و ١٢)"
                            : "غير متعجِّل — ثلاثة أيام (١١ و ١٢ و ١٣)"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-full p-1">
                      <button
                        onClick={() => setIsMutaajil(false)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          isMutaajil === false ? "bg-primary text-white shadow-sm" : "text-muted-foreground"
                        }`}
                      >
                        لا
                      </button>
                      <button
                        onClick={() => setIsMutaajil(true)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          isMutaajil === true ? "bg-primary text-white shadow-sm" : "text-muted-foreground"
                        }`}
                      >
                        نعم
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
