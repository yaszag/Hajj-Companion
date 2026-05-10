import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { useUpdateNavigation, useCancelNavigation, useGetNavigationHistory } from "@workspace/api-client-react";
import { X, Navigation, MapPin } from "lucide-react";
import { haversineDistance, calculateBearing, bearingToArabic, formatDistance, etaMinutes } from "@/lib/navigation";
import { useToast } from "@/hooks/use-toast";

export default function NavigatePage() {
  const params = useParams();
  const sessionId = params.sessionId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [destination, setDestination] = useState<{lat: number, lng: number, name: string} | null>(null);
  
  const [distance, setDistance] = useState<number | null>(null);
  const [bearing, setBearing] = useState<number | null>(null);
  
  const updateNav = useUpdateNavigation();
  const cancelNav = useCancelNavigation();
  
  // We need to fetch the session info. Since there's no specific getSession hook, 
  // we'll try to find it in history or just rely on the fact that we might not have it and need to handle it gracefully.
  // In a real app we'd have a useGetNavigationSession(sessionId)
  
  useEffect(() => {
    // Watch position
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentCoords({ lat, lng });
          
          if (destination) {
            const dist = haversineDistance(lat, lng, destination.lat, destination.lng);
            const bear = calculateBearing(lat, lng, destination.lat, destination.lng);
            
            setDistance(dist);
            setBearing(bear);
            
            // Periodically update server
            if (sessionId) {
              updateNav.mutate({
                sessionId,
                data: {
                  distanceRemainingM: dist,
                  bearingDegrees: bear,
                  directionAr: bearingToArabic(bear),
                  etaMinutes: etaMinutes(dist),
                  isArrived: dist < 30
                }
              });
            }
          }
        },
        (error) => {
          console.error("Error watching position", error);
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
      
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [destination, sessionId]);
  
  // Mock destination for now since we don't have the session data directly
  useEffect(() => {
    // In a real implementation we would fetch the session details using the sessionId
    // For this prototype, we'll set a mock destination if we don't have one
    if (!destination) {
      setDestination({
        lat: 21.4225, // Mecca
        lng: 39.8262,
        name: "وجهة الملاحة"
      });
    }
  }, []);

  const handleCancel = () => {
    if (sessionId) {
      cancelNav.mutate({ sessionId }, {
        onSuccess: () => {
          setLocation("/places");
        }
      });
    } else {
      setLocation("/places");
    }
  };

  const isArrived = distance !== null && distance < 30;

  return (
    <AppLayout title="التوجيه" hideNav>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-card overflow-hidden">
        
        {/* Destination Header */}
        <div className="bg-primary text-primary-foreground p-6 rounded-b-[2rem] shadow-lg z-10 flex flex-col items-center justify-center min-h-[20vh]">
          <h2 className="text-xl font-medium opacity-90 mb-1">الوجهة</h2>
          <h1 className="text-3xl font-bold text-center">{destination?.name || "جاري التحميل..."}</h1>
          
          {distance !== null && (
            <div className="mt-4 bg-primary-foreground/20 px-6 py-2 rounded-full backdrop-blur-sm">
              <span className="text-lg">{bearingToArabic(bearing || 0)}</span>
            </div>
          )}
        </div>

        {/* Compass Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          
          {isArrived ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
              <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.5)]">
                <MapPin className="w-16 h-16 text-white animate-bounce" />
              </div>
              <h2 className="text-4xl font-bold text-green-600 mb-2">وصلت! 🎉</h2>
              <p className="text-muted-foreground text-lg">الحمد لله على السلامة</p>
              
              <Button className="mt-8 px-8" size="lg" onClick={() => setLocation("/places")}>
                إنهاء
              </Button>
            </div>
          ) : (
            <>
              {/* Compass Ring */}
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border-4 border-muted flex items-center justify-center shadow-inner">
                {/* North indicator */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-muted-foreground font-bold text-lg">ش</div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-muted-foreground">ج</div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">ش</div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">غ</div>
                
                {/* The Arrow */}
                {bearing !== null ? (
                  <div 
                    className="w-full h-full absolute transition-transform duration-1000 ease-out flex flex-col items-center pt-8"
                    style={{ transform: `rotate(${bearing}deg)` }}
                  >
                    <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[40px] border-b-primary filter drop-shadow-md"></div>
                    <div className="w-2 h-16 bg-primary/20 mt-1 rounded-full"></div>
                  </div>
                ) : (
                  <div className="animate-spin text-muted-foreground opacity-30">
                    <Navigation className="w-12 h-12" />
                  </div>
                )}
                
                {/* Center dot */}
                <div className="w-6 h-6 bg-primary rounded-full absolute shadow-md border-2 border-white z-10"></div>
              </div>

              {/* Distance & ETA */}
              <div className="mt-12 text-center">
                {distance !== null ? (
                  <>
                    <div className="text-6xl font-bold text-foreground mb-2" dir="ltr">
                      {formatDistance(distance)}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      الوقت المقدر: {etaMinutes(distance)} دقيقة
                    </div>
                  </>
                ) : (
                  <div className="text-xl text-muted-foreground animate-pulse">
                    جاري تحديد الموقع...
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        {!isArrived && (
          <div className="p-6 flex justify-center">
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full w-16 h-16 shadow-md border-border bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              onClick={handleCancel}
              disabled={cancelNav.isPending}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
