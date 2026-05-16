import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, PhoneCall, ShieldAlert, CheckCircle2, X, MessageSquare } from "lucide-react";
import { useSendSos, useResolveEmergency } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const ALERT_TYPES = [
  { value: "medical", label: "مساعدة طبية", icon: "🏥", desc: "إصابة أو مرض يحتاج عناية" },
  { value: "lost", label: "مفقود / ضائع", icon: "🧭", desc: "لا أعرف مكاني أو فقدت مجموعتي" },
  { value: "danger", label: "خطر / طارئ", icon: "⚠️", desc: "وضع خطر يحتاج تدخل فوري" },
  { value: "general", label: "مساعدة عامة", icon: "🙏", desc: "أحتاج مساعدة عامة" },
];

export default function EmergencyPage() {
  const { toast } = useToast();
  const [activeEmergency, setActiveEmergency] = useState<boolean>(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedType, setSelectedType] = useState<string>("medical");
  const [message, setMessage] = useState("");
  const [showTypePicker, setShowTypePicker] = useState(false);

  const sendSos = useSendSos();
  const resolveEmergency = useResolveEmergency();

  const handleSos = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCoords({ lat, lng });

          sendSos.mutate(
            {
              data: {
                latitude: lat,
                longitude: lng,
                alertType: selectedType,
                message: message.trim() || null,
              },
            },
            {
              onSuccess: () => {
                setActiveEmergency(true);
                toast({
                  title: "تم إرسال نداء الاستغاثة",
                  description: "تم إبلاغ مجموعتك بموقعك الحالي ونوع المساعدة المطلوبة",
                  variant: "destructive",
                });
              },
            }
          );
        },
        () => {
          sendSos.mutate(
            {
              data: { alertType: selectedType, message: message.trim() || null },
            },
            {
              onSuccess: () => {
                setActiveEmergency(true);
                toast({
                  title: "تم إرسال نداء الاستغاثة",
                  description: "تعذر تحديد موقعك. تم إبلاغ مجموعتك بحالة الطوارئ",
                  variant: "destructive",
                });
              },
            }
          );
        }
      );
    } else {
      sendSos.mutate(
        { data: { alertType: selectedType, message: message.trim() || null } },
        {
          onSuccess: () => setActiveEmergency(true),
        }
      );
    }
  };

  const handleResolve = () => {
    resolveEmergency.mutate(
      { id: "active" },
      {
        onSuccess: () => {
          setActiveEmergency(false);
          setMessage("");
          setSelectedType("medical");
          toast({
            title: "تم إنهاء حالة الطوارئ",
            description: "تم إبلاغ المجموعة بأنك بأمان",
          });
        },
      }
    );
  };

  if (!activeEmergency) {
    return (
      <AppLayout title="الطوارئ">
        <div className="p-4 space-y-6">
          {/* Type Picker */}
          <div>
            <h3 className="font-semibold text-sm mb-3 px-1">نوع المساعدة المطلوبة</h3>
            <div className="grid grid-cols-2 gap-2">
              {ALERT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`p-3 rounded-xl border-2 text-right transition-all ${
                    selectedType === type.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <p className="font-bold text-sm mt-1">{type.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <h3 className="font-semibold text-sm mb-3 px-1 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              تفاصيل إضافية (اختياري)
            </h3>
            <Textarea
              placeholder="اشرح ما تحتاجه... مثال: أحتاج مساعدة طبية في خيمة A12"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground mt-1 text-left">{message.length}/300</p>
          </div>

          {/* SOS Button */}
          <div className="flex flex-col items-center pt-4">
            <button
              onClick={handleSos}
              disabled={sendSos.isPending}
              className="w-56 h-56 rounded-full bg-destructive text-destructive-foreground shadow-[0_0_50px_rgba(220,38,38,0.5)] flex flex-col items-center justify-center transition-transform active:scale-95 disabled:opacity-80"
            >
              <AlertTriangle className="w-20 h-20 mb-3" />
              <span className="text-2xl font-bold">نداء طوارئ</span>
              <span className="text-sm opacity-80 mt-1">SOS</span>
            </button>

            <p className="text-xs text-muted-foreground text-center mt-4 max-w-xs">
              عند الضغط سيتم إرسال موقعك الحالي ونوع المساعدة المطلوبة إلى جميع أعضاء مجموعتك
            </p>
          </div>

          {/* Emergency Numbers */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm px-1">أرقام الطوارئ</h3>
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
      </AppLayout>
    );
  }

  // Active Emergency State
  return (
    <AppLayout title="الطوارئ">
      <div className="p-4 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="w-full flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full bg-destructive/20 flex items-center justify-center mb-6 animate-pulse">
            <AlertTriangle className="w-16 h-16 text-destructive" />
          </div>

          <h2 className="text-2xl font-bold text-destructive mb-2">حالة طوارئ نشطة</h2>
          <p className="text-lg mb-2">تم إبلاغ مجموعتك بموقعك وطلب المساعدة.</p>

          {selectedType && (
            <div className="mb-4 px-4 py-2 bg-destructive/10 rounded-full">
              <span className="text-sm font-bold text-destructive">
                {ALERT_TYPES.find((t) => t.value === selectedType)?.icon}{" "}
                {ALERT_TYPES.find((t) => t.value === selectedType)?.label}
              </span>
            </div>
          )}

          {message && (
            <div className="w-full mb-6 p-4 bg-card rounded-xl border border-border text-right">
              <p className="text-xs text-muted-foreground mb-1">رسالتك:</p>
              <p className="text-sm">{message}</p>
            </div>
          )}

          {coords && (
            <div className="w-full mb-6 p-4 bg-primary/5 rounded-xl border border-primary/20 text-right">
              <p className="text-xs text-muted-foreground mb-1">موقعك الحالي:</p>
              <p className="text-sm font-mono" dir="ltr">
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            </div>
          )}

          <div className="p-6 bg-card rounded-xl border border-border w-full mb-8 shadow-sm text-right">
            <h3 className="font-bold text-lg mb-4">تعليمات هامة:</h3>
            <ul className="space-y-3">
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
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>أعضاء مجموعتك تم إبلاغهم بموقعك.</span>
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
      </div>
    </AppLayout>
  );
}
