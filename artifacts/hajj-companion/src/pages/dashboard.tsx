import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { MapPin, Users, AlertTriangle, Compass, ListTodo, Navigation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

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

        {/* Emergency Quick Action */}
        <Link href="/emergency">
          <Button variant="destructive" size="lg" className="w-full font-bold h-14 text-lg shadow-md hover-elevate">
            <AlertTriangle className="mr-2 ml-2 h-6 w-6" />
            حالة طوارئ
          </Button>
        </Link>

        {/* Manasik Progress */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg flex items-center">
              <ListTodo className="w-5 h-5 ml-2 text-primary" />
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
