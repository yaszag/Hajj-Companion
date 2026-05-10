import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, PhoneCall, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useSendSos, useResolveEmergency } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function EmergencyPage() {
  const { toast } = useToast();
  const [activeEmergency, setActiveEmergency] = useState<boolean>(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  
  const sendSos = useSendSos();
  const resolveEmergency = useResolveEmergency();

  const handleSos = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        
        sendSos.mutate({
          data: {
            latitude: lat,
            longitude: lng,
            alertType: "medical" // default
          }
        }, {
          onSuccess: () => {
            setActiveEmergency(true);
            toast({
              title: "تم إرسال نداء الاستغاثة",
              description: "تم إبلاغ مجموعتك بموقعك الحالي",
              variant: "destructive"
            });
          }
        });
      }, () => {
        // Fallback without location
        sendSos.mutate({
          data: { alertType: "general" }
        }, {
          onSuccess: () => {
            setActiveEmergency(true);
            toast({
              title: "تم إرسال نداء الاستغاثة",
              description: "تعذر تحديد موقعك. تم إبلاغ مجموعتك بحالة الطوارئ",
              variant: "destructive"
            });
          }
        });
      });
    } else {
      sendSos.mutate({
        data: { alertType: "general" }
      }, {
        onSuccess: () => setActiveEmergency(true)
      });
    }
  };

  const handleResolve = () => {
    resolveEmergency.mutate({
      // We don't have an ID in this simple state, but assume the API handles active alert for current user
      id: "active" 
    }, {
      onSuccess: () => {
        setActiveEmergency(false);
        toast({
          title: "تم إنهاء حالة الطوارئ",
          description: "تم إبلاغ المجموعة بأنك بأمان"
        });
      }
    });
  };

  return (
    <AppLayout title="الطوارئ">
      <div className="p-4 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        
        {!activeEmergency ? (
          <div className="w-full flex flex-col items-center">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2">هل تحتاج إلى مساعدة؟</h2>
              <p className="text-muted-foreground">اضغط على الزر أدناه لإرسال نداء استغاثة وموقعك الحالي إلى مجموعتك</p>
            </div>

            <button 
              onClick={handleSos}
              disabled={sendSos.isPending}
              className="w-64 h-64 rounded-full bg-destructive text-destructive-foreground shadow-[0_0_50px_rgba(220,38,38,0.5)] flex flex-col items-center justify-center transition-transform active:scale-95 disabled:opacity-80"
            >
              <AlertTriangle className="w-24 h-24 mb-4" />
              <span className="text-3xl font-bold">نداء طوارئ</span>
              <span className="text-sm opacity-80 mt-2">SOS</span>
            </button>
            
            <div className="mt-12 w-full space-y-4">
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <PhoneCall className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold">الإسعاف</h4>
                      <p className="text-muted-foreground text-sm">الهلال الأحمر السعودي</p>
                    </div>
                  </div>
                  <a href="tel:997" className="font-bold text-lg text-primary" dir="ltr">997</a>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold">الشرطة</h4>
                      <p className="text-muted-foreground text-sm">الأمن العام</p>
                    </div>
                  </div>
                  <a href="tel:999" className="font-bold text-lg text-primary" dir="ltr">999</a>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-destructive/20 flex items-center justify-center mb-6 animate-pulse">
              <AlertTriangle className="w-16 h-16 text-destructive" />
            </div>
            
            <h2 className="text-2xl font-bold text-destructive mb-2">حالة طوارئ نشطة</h2>
            <p className="text-lg mb-8">تم إبلاغ مجموعتك بموقعك وطلب المساعدة.</p>
            
            <div className="p-6 bg-card rounded-xl border border-border w-full mb-8 shadow-sm">
              <h3 className="font-bold text-lg mb-4">تعليمات هامة:</h3>
              <ul className="text-right space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>ابق في مكانك إذا كان آمناً.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>حاول لفت انتباه أحد رجال الأمن أو الكشافة.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>حافظ على هدوئك وتنفس بانتظام.</span>
                </li>
              </ul>
            </div>
            
            <Button 
              size="lg" 
              className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-lg font-bold"
              onClick={handleResolve}
              disabled={resolveEmergency.isPending}
            >
              <CheckCircle2 className="mr-2 ml-2 w-6 h-6" />
              أنا بخير - إنهاء حالة الطوارئ
            </Button>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
