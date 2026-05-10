import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { useUpdateNavigation, useCancelNavigation } from "@workspace/api-client-react";
import { X, Navigation, MapPin, Compass } from "lucide-react";
import { haversineDistance, calculateBearing, bearingToArabic, formatDistance, etaRange } from "@/lib/navigation";
import { useToast } from "@/hooks/use-toast";

export default function NavigatePage() {
  const params = useParams();
  const sessionId = params.sessionId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [bearing, setBearing] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [compassAvailable, setCompassAvailable] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  const updateNav = useUpdateNavigation();
  const cancelNav = useCancelNavigation();

  // Device orientation (compass heading)
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const heading = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading ?? e.alpha;
      if (heading !== null && heading !== undefined) {
        setDeviceHeading(heading);
        setCompassAvailable(true);
      }
    };

    if ("DeviceOrientationEvent" in window) {
      const DevOrEv = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (typeof DevOrEv.requestPermission === "function") {
        DevOrEv.requestPermission()
          .then((result: string) => {
            if (result === "granted") {
              window.addEventListener("deviceorientation", handler, true);
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener("deviceorientation", handler, true);
      }
    }

    return () => window.removeEventListener("deviceorientation", handler, true);
  }, []);

  // GPS watch position
  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentCoords({ lat, lng });
        setGpsAccuracy(pos.coords.accuracy);

        if (destination) {
          const dist = haversineDistance(lat, lng, destination.lat, destination.lng);
          const bear = calculateBearing(lat, lng, destination.lat, destination.lng);
          setDistance(dist);
          setBearing(bear);

          if (sessionId) {
            updateNav.mutate({
              sessionId,
              data: { currentLat: lat, currentLng: lng },
            });
          }
        }
      },
      () => {
        toast({ title: "تعذر تحديد الموقع", description: "الرجاء تفعيل GPS", variant: "destructive" });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [destination, sessionId]);

  // Default destination (Kaaba — placeholder until session API provides it)
  useEffect(() => {
    if (!destination) {
      setDestination({ lat: 21.4225, lng: 39.8262, name: "المسجد الحرام" });
    }
  }, []);

  const handleCancel = () => {
    if (sessionId) {
      cancelNav.mutate({ sessionId }, { onSuccess: () => setLocation("/places") });
    } else {
      setLocation("/places");
    }
  };

  const isArrived = distance !== null && distance < 30;

  // Arrow rotation: bearing to destination relative to device facing direction
  const arrowRotation = (() => {
    if (bearing === null) return null;
    if (!compassAvailable || deviceHeading === null) return bearing;
    let angle = bearing - deviceHeading;
    // Normalize to -180..180 for shortest rotation
    angle = ((angle + 540) % 360) - 180;
    return angle;
  })();

  const arrowColor = distance !== null
    ? distance < 200 ? "#1D9E75" : distance < 500 ? "#EF9F27" : "#3b82f6"
    : "#3b82f6";

  const weakGps = gpsAccuracy !== null && gpsAccuracy > 30;

  return (
    <AppLayout title="التوجيه" hideNav>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-card overflow-hidden">
        {/* Destination Header */}
        <div className="bg-primary text-primary-foreground p-6 rounded-b-[2rem] shadow-lg z-10 flex flex-col items-center justify-center min-h-[22vh]">
          <h2 className="text-base font-medium opacity-80 mb-1">الوجهة</h2>
          <h1 className="text-2xl font-bold text-center">{destination?.name ?? "جاري التحميل..."}</h1>
          {distance !== null && (
            <div className="mt-3 flex items-center gap-3">
              <div className="bg-primary-foreground/20 px-4 py-1.5 rounded-full text-sm backdrop-blur-sm">
                {bearingToArabic(bearing ?? 0)}
              </div>
              <div className="bg-primary-foreground/20 px-3 py-1.5 rounded-full text-sm backdrop-blur-sm">
                {formatDistance(distance)}
              </div>
            </div>
          )}
          {weakGps && (
            <p className="mt-2 text-xs opacity-70">⚠️ إشارة GPS ضعيفة — دقة {Math.round(gpsAccuracy!)} م</p>
          )}
        </div>

        {/* Compass Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          {isArrived ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
              <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                <MapPin className="w-16 h-16 text-white animate-bounce" />
              </div>
              <h2 className="text-4xl font-bold text-green-600 mb-2">وصلت! 🎉</h2>
              <p className="text-muted-foreground text-lg">الحمد لله على السلامة</p>
              <Button className="mt-8 px-8" size="lg" onClick={() => setLocation("/places")}>إنهاء</Button>
            </div>
          ) : (
            <>
              {/* Compass Ring */}
              <div className="relative w-64 h-64 md:w-72 md:h-72">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-muted shadow-inner bg-card/50" />

                {/* Cardinal labels */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 text-muted-foreground font-bold text-base">ش</div>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-muted-foreground font-bold text-sm">ج</div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">غ</div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">ش</div>

                {/* Tick marks at 45° */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                  <div
                    key={deg}
                    className="absolute inset-0 flex items-start justify-center"
                    style={{ transform: `rotate(${deg}deg)` }}
                  >
                    <div className="w-1 h-4 bg-muted-foreground/30 rounded-full mt-2" />
                  </div>
                ))}

                {/* Directional Arrow */}
                {arrowRotation !== null ? (
                  <div
                    ref={arrowRef}
                    className="absolute inset-0 flex flex-col items-center pt-10 transition-transform duration-300 ease-out"
                    style={{ transform: `rotate(${arrowRotation}deg)` }}
                  >
                    {/* Arrow head (triangle) */}
                    <div
                      className="w-0 h-0 filter drop-shadow-lg"
                      style={{
                        borderLeft: "16px solid transparent",
                        borderRight: "16px solid transparent",
                        borderBottom: `36px solid ${arrowColor}`,
                      }}
                    />
                    {/* Arrow body */}
                    <div className="w-3 flex-1 max-h-16 rounded-b-full opacity-60" style={{ backgroundColor: arrowColor }} />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center animate-spin opacity-20">
                    <Compass className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}

                {/* Center dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 bg-primary rounded-full shadow-md border-2 border-white z-10" />
                </div>
              </div>

              {/* Compass availability indicator */}
              {!compassAvailable && (
                <p className="mt-3 text-xs text-muted-foreground text-center">
                  حرّك جهازك للحصول على اتجاه أدق
                </p>
              )}

              {/* Distance & ETA */}
              <div className="mt-8 text-center">
                {distance !== null ? (
                  <>
                    <div className="text-5xl font-bold text-foreground mb-1" dir="ltr">
                      {formatDistance(distance)}
                    </div>
                    <div className="text-base text-muted-foreground">
                      الوقت المقدر: {etaRange(distance)}
                    </div>
                  </>
                ) : (
                  <div className="text-lg text-muted-foreground animate-pulse">
                    جاري تحديد الموقع...
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Cancel */}
        {!isArrived && (
          <div className="p-6 flex justify-center">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14 shadow-md border-border bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              onClick={handleCancel}
              disabled={cancelNav.isPending}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
