import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLocation } from "wouter";
import { useCreatePlace } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MapPin, Navigation, Crosshair } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet marker icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const EMOJIS = ["🏨", "🕌", "⛺", "🏥", "🍽️", "🚌", "🛍️", "📍", "🏁"];
const COLORS = ["#1D9E75", "#2563EB", "#DC2626", "#D97706", "#7C3AED", "#0891B2"];
const MECCA_COORDS = { lat: 21.4225, lng: 39.8262 };

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (p: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function AddPlacePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createPlace = useCreatePlace();
  
  const [nameAr, setNameAr] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [isShared, setIsShared] = useState(false);
  
  const [position, setPosition] = useState<L.LatLng | null>(null);

  useEffect(() => {
    // Initial position in Mecca
    setPosition(new L.LatLng(MECCA_COORDS.lat, MECCA_COORDS.lng));
  }, []);

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition(new L.LatLng(pos.coords.latitude, pos.coords.longitude));
          toast({ title: "تم تحديد موقعك الحالي" });
        },
        () => {
          toast({ title: "تعذر تحديد الموقع", variant: "destructive" });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr || !position) {
      toast({ title: "الرجاء إدخال الاسم وتحديد الموقع", variant: "destructive" });
      return;
    }

    createPlace.mutate({
      data: {
        nameAr,
        emoji,
        color,
        latitude: position.lat,
        longitude: position.lng,
        isShared
      }
    }, {
      onSuccess: () => {
        toast({ title: "تم حفظ الموقع بنجاح" });
        setLocation("/places");
      }
    });
  };

  return (
    <AppLayout title="إضافة موقع جديد" hideNav>
      <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-md mx-auto">
        
        <div className="space-y-2">
          <Label htmlFor="name">اسم الموقع</Label>
          <Input 
            id="name" 
            placeholder="مثال: فندقي، خيمتي..." 
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>الرمز التعبيري</Label>
          <div className="flex gap-2 flex-wrap">
            {EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${emoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted hover:bg-muted/80'}`}
                onClick={() => setEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>اللون المميز</Label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                className={`w-10 h-10 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>الموقع على الخريطة</Label>
            <Button type="button" variant="ghost" size="sm" onClick={handleGetCurrentLocation} className="h-8">
              <Crosshair className="w-4 h-4 ml-1" />
              موقعي الحالي
            </Button>
          </div>
          <div className="h-48 w-full rounded-xl overflow-hidden border border-border z-0 relative">
            {position && (
              <MapContainer 
                center={position} 
                zoom={14} 
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            )}
          </div>
          <p className="text-xs text-muted-foreground">اضغط على الخريطة لتحديد الموقع بدقة</p>
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">مشاركة مع المجموعة</h4>
              <p className="text-xs text-muted-foreground mt-1">سيتمكن أفراد مجموعتك من رؤية هذا الموقع</p>
            </div>
            <Switch checked={isShared} onCheckedChange={setIsShared} dir="ltr" />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={createPlace.isPending}>
          {createPlace.isPending ? "جاري الحفظ..." : "حفظ الموقع"}
        </Button>

      </form>
    </AppLayout>
  );
}
