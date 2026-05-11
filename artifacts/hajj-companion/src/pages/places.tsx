import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetPlaces, useStartNavigation } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Navigation, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function PlacesPage() {
  const [, setLocation] = useLocation();
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  const { data: places, isLoading } = useGetPlaces(
    coords ? { lat: coords.lat, lng: coords.lng } : undefined
  );

  const startNav = useStartNavigation();

  const handleNavigate = (placeId: string, lat: number, lng: number, name: string) => {
    startNav.mutate({
      data: {
        placeId,
        destinationLat: lat,
        destinationLng: lng,
        destinationName: name
      }
    }, {
      onSuccess: (data) => {
        const dest = data.destination;
        const params = new URLSearchParams({
          lat: String(dest.lat),
          lng: String(dest.lng),
          name: dest.name,
          ...(dest.emoji ? { emoji: dest.emoji } : {}),
        });
        setLocation(`/navigate/${data.sessionId}?${params.toString()}`);
      }
    });
  };

  return (
    <AppLayout title="مواقعي">
      <div className="p-4 space-y-4 relative min-h-[calc(100vh-8rem)]">
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : places && places.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {places.map((place) => (
              <Card key={place.id} className="overflow-hidden flex flex-col">
                <div className="h-2 w-full" style={{ backgroundColor: place.color }} />
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm" style={{ backgroundColor: place.color + '20', color: place.color }}>
                      {place.emoji ? <span>{place.emoji}</span> : <MapPin className="w-5 h-5" />}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-base line-clamp-1">{place.nameAr}</h3>
                  
                  {place.distanceFromUserM !== undefined && place.distanceFromUserM !== null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      يبعد {place.distanceFromUserM >= 1000 ? `${(place.distanceFromUserM/1000).toFixed(1)} كم` : `${Math.round(place.distanceFromUserM)} م`}
                    </p>
                  )}
                  
                  <div className="mt-auto pt-4">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleNavigate(place.id, place.latitude, place.longitude, place.nameAr)}
                      disabled={startNav.isPending}
                    >
                      <Navigation className="w-4 h-4 ml-1" />
                      توجيه
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 flex flex-col items-center">
            <MapPin className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">لا توجد مواقع محفوظة</h3>
            <p className="text-muted-foreground mb-6">احفظ مواقعك المهمة مثل الفندق والمخيم للعودة إليها بسهولة</p>
          </div>
        )}

        <Link href="/places/new">
          <Button 
            className="fixed bottom-20 left-4 w-14 h-14 rounded-full shadow-lg p-0 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90"
            size="icon"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </Link>

      </div>
    </AppLayout>
  );
}
