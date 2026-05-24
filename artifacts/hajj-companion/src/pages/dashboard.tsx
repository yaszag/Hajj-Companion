import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useGetDashboard } from "@workspace/api-client-react";
import { getActiveKhatma, getActiveTasbih, getContextualAdhkar } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { MapPin, Users, AlertTriangle, Navigation, BookOpen, Sparkles, Sunrise, Sunset, Moon, Sun } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KhatmaWidget {
  id: string;
  name: string;
  daysRemaining: number;
  progressPercent: number;
  statusMessage: string;
  todayAyatRead: number;
  todayTarget: number;
  currentSurahName: string;
  currentJuz: number;
}

interface TasbihWidget {
  phraseAr: string;
  currentCount: number;
  targetCount: number;
  roundsCompleted: number;
  totalCount: number;
}

interface AdhkarItem {
  id: string;
  phraseAr: string;
  category: string;
  timeOfDay: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [khatma, setKhatma] = useState<KhatmaWidget | null>(null);
  const [tasbih, setTasbih] = useState<TasbihWidget | null>(null);
  const [adhkar, setAdhkar] = useState<AdhkarItem[]>([]);
  const [adhkarIndex, setAdhkarIndex] = useState(0);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  const { data: dashboard, isLoading } = useGetDashboard(
    coords ? { lat: coords.lat, lng: coords.lng } : undefined
  );

  useEffect(() => {
    getActiveKhatma()
      .then((data) => { if (data) setKhatma(data); })
      .catch(() => {});

    getActiveTasbih()
      .then((data) => {
        if (data && data.preset) {
          setTasbih({
            phraseAr: data.preset.phraseAr,
            currentCount: data.currentCount,
            targetCount: data.targetCount,
            roundsCompleted: data.roundsCompleted,
            totalCount: data.totalCount,
          });
        }
      })
      .catch(() => {});

    getContextualAdhkar()
      .then((data) => setAdhkar(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (adhkar.length <= 1) return;
    const interval = setInterval(() => {
      setAdhkarIndex((prev) => (prev + 1) % adhkar.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [adhkar.length]);

  const getTimeIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return <Sunrise className="w-4 h-4 text-amber-500" />;
    if (hour >= 12 && hour < 17) return <Sun className="w-4 h-4 text-amber-600" />;
    if (hour >= 17 && hour < 20) return <Sunset className="w-4 h-4 text-orange-500" />;
    return <Moon className="w-4 h-4 text-blue-500" />;
  };

  return (
    <AppLayout title="الرئيسية">
      <div className="p-4 space-y-6">

        {/* Greeting */}
        <section>
          <h2 className="text-2xl font-bold text-foreground">
            مرحباً بك، {user?.fullNameAr.split(' ')[0]}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            تقبل الله طاعتك ويسر حجك
          </p>
        </section>

        {/* Arafah Plan Entry */}
        <Link href="/arafah">
          <Card className="border-amber-400/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="text-3xl">🤲</div>
              <div className="flex-1 text-right">
                <p className="font-bold text-sm">خطة يوم عرفة</p>
                <p className="text-xs text-muted-foreground mt-0.5">أهداف مخصصة · أذكار · أدعية</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Emergency Quick Action */}
        <Link href="/emergency">
          <Button variant="destructive" size="lg" className="w-full font-bold h-14 text-lg shadow-md hover-elevate">
            <AlertTriangle className="mr-2 ml-2 h-6 w-6" />
            حالة طوارئ
          </Button>
        </Link>

        {/* Khatma Widget */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              ختمة القرآن
            </h3>
            <Link href="/khatma">
              <span className="text-sm text-primary cursor-pointer">التفاصيل</span>
            </Link>
          </div>

          {khatma ? (
            <Link href="/khatma">
              <Card className="border-primary/10 cursor-pointer hover:border-primary/30 transition-colors hover-elevate">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold">{khatma.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        سورة {khatma.currentSurahName} · الجزء {khatma.currentJuz}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-primary">{khatma.progressPercent}%</p>
                    </div>
                  </div>

                  <Progress value={khatma.progressPercent} className="h-2.5 w-full bg-muted mb-3" />

                  <div className="flex items-center justify-between text-xs">
                    <span className={cn(
                      "font-semibold px-2 py-1 rounded-full",
                      khatma.statusMessage.includes("متأخر") ? "bg-amber-100 text-amber-700" :
                      khatma.statusMessage.includes("متقدم") ? "bg-green-100 text-green-700" :
                      "bg-primary/10 text-primary"
                    )}>
                      {khatma.statusMessage}
                    </span>
                    <span className="text-muted-foreground">
                      {khatma.daysRemaining} أيام · {khatma.todayAyatRead}/{khatma.todayTarget} اليوم
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-5 text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-3">ابدأ ختمة القرآن</p>
                <Link href="/khatma">
                  <Button variant="default" size="sm">ابدأ الآن</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Tasbih Widget + Contextual Adhkar */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              التسبيح والأذكار
            </h3>
            <Link href="/tasbih">
              <span className="text-sm text-primary cursor-pointer">المزيد</span>
            </Link>
          </div>

          <div className="space-y-3">
            {/* Active Tasbih */}
            {tasbih && (
              <Link href="/tasbih">
                <Card className="border-gold/20 cursor-pointer hover:border-gold/40 transition-colors hover-elevate bg-gold/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-lg font-bold font-dua">{tasbih.phraseAr}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tasbih.currentCount} / {tasbih.targetCount} · {tasbih.roundsCompleted} جولات
                        </p>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center">
                        <span className="text-xl font-bold text-gold">{tasbih.currentCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}

            {/* Contextual Adhkar Carousel */}
            <div className="flex items-center gap-2 mb-2">
              {getTimeIcon()}
              <p className="text-xs font-bold text-muted-foreground">أذكار الوقت الحالي</p>
            </div>
            <Link href="/tasbih">
              <Card className="cursor-pointer hover:border-primary/30 transition-all duration-300 hover-elevate min-h-[18rem] content-center relative overflow-hidden group">
                {/* Decorative gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Decorative corner elements */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-12 h-12 bg-primary/5 rounded-tr-full pointer-events-none" />
                
                <CardContent className="p-0 w-full h-full relative z-10 flex items-center justify-center">
                  {adhkar.length > 0 ? (
                    <div className="relative w-full h-full min-h-28 flex items-center justify-center">
                      {adhkar.map((dhikr, i) => (
                        <div
                          key={dhikr.id}
                          className={cn(
                            "absolute inset-0 flex flex-col items-center justify-center px-6 transition-all duration-700",
                            i === adhkarIndex
                              ? "opacity-100 translate-y-0 scale-100"
                              : "opacity-0 translate-y-4 scale-95"
                          )}
                        >
                          {/* Arabic phrase with enhanced styling */}
                          <div className="bg-primary/5 rounded-xl px-4 py-3 mb-2 w-full text-center">
                            <p className="text-xl font-bold font-dua leading-relaxed text-foreground">{dhikr.phraseAr}</p>
                          </div>
                          
                          {/* Category and time info */}
                          <div className="flex items-center justify-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                              {dhikr.category}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              × {dhikr.timeOfDay === "general" ? "كل وقت" : dhikr.timeOfDay === "morning" ? "صباح" : dhikr.timeOfDay === "afternoon" ? "مساء" : dhikr.timeOfDay === "evening" ? "غروب" : "ليل"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full min-h-[7rem]">
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Manasik Progress */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg flex items-center">
              <BookOpen className="w-5 h-5 ml-2 text-primary" />
              المناسك
            </h3>
            <Link href="/manasik">
              <span className="text-sm text-primary cursor-pointer">التفاصيل</span>
            </Link>
          </div>

          <Card className="border-primary/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full pointer-events-none" />
            <CardContent className="p-5">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : dashboard ? (
                <div className="flex flex-col">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">التقدم الكلي</p>
                      <p className="text-3xl font-bold text-primary">{Math.round(dashboard.manasikSummary.percentComplete)}%</p>
                    </div>
                    <div className="text-left text-sm text-muted-foreground">
                      <span>مكتمل: {dashboard.manasikSummary.completed}/{dashboard.manasikSummary.total}</span>
                    </div>
                  </div>
                  <Progress value={dashboard.manasikSummary.percentComplete} className="h-3 w-full bg-muted" />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>

        {/* Group Overview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg flex items-center">
              <Users className="w-5 h-5 ml-2 text-primary" />
              المجموعة
            </h3>
            <Link href="/group">
              <span className="text-sm text-primary cursor-pointer">التفاصيل</span>
            </Link>
          </div>

          <Card className="border-primary/10">
            <CardContent className="p-5 flex items-center justify-between">
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : dashboard?.group ? (
                <>
                  <div>
                    <h4 className="font-semibold">{dashboard.group.nameAr}</h4>
                    <p className="text-sm text-muted-foreground">
                      {dashboard.group.onlineCount} متصل من أصل {dashboard.group.memberCount}
                    </p>
                  </div>
                  <Link href="/group">
                    <Button variant="outline" size="sm" className="rounded-full">
                      تتبع
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center w-full">
                  <p className="text-sm text-muted-foreground mb-3">أنت لست في مجموعة بعد</p>
                  <Link href="/group">
                    <Button variant="default" size="sm">
                      انضم لمجموعة
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Nearby Places */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg flex items-center">
              <MapPin className="w-5 h-5 ml-2 text-primary" />
              أماكن قريبة
            </h3>
            <Link href="/places">
              <span className="text-sm text-primary cursor-pointer">عرض الكل</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {isLoading ? (
              [1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)
            ) : dashboard?.nearbyPlaces?.length ? (
              dashboard.nearbyPlaces.slice(0, 3).map(place => (
                <Card key={place.id} className="border-primary/10">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm" style={{ backgroundColor: place.color + '20', color: place.color }}>
                        {place.emoji ? <span>{place.emoji}</span> : <MapPin className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{place.nameAr}</h4>
                        {place.distanceFromUserM !== undefined && place.distanceFromUserM !== null && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            يبعد {place.distanceFromUserM >= 1000 ? `${(place.distanceFromUserM/1000).toFixed(1)} كم` : `${Math.round(place.distanceFromUserM)} م`}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link href={`/navigate/${place.id}`}>
                      <Button variant="secondary" size="icon" className="rounded-full w-8 h-8">
                        <Navigation className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground">
                  لا توجد أماكن محفوظة قريبة
                </CardContent>
              </Card>
            )}
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
