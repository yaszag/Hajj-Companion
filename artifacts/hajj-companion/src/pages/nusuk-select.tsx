import React, { useState } from "react";
import { useLocation } from "wouter";
import { useUpdateNusukType } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const NUSUK_OPTIONS = [
  {
    key: "ifrad" as const,
    titleAr: "الإفراد",
    emoji: "🕋",
    descAr: "يُحرم بالحج وحده من الميقات. الأيسر والأقل تكليفاً.",
    rulesAr: "لا يذبح هدياً. يطوف طواف القدوم عند الوصول.",
    color: "#1D9E75",
  },
  {
    key: "tamattu" as const,
    titleAr: "التمتع",
    emoji: "🌙",
    descAr: "يُحرم بالعمرة أولاً، ثم يتحلل، ثم يُحرم بالحج يوم التروية.",
    rulesAr: "يذبح الهدي. الأشيع بين الحجاج في هذا العصر.",
    color: "#EF9F27",
  },
  {
    key: "qiran" as const,
    titleAr: "القران",
    emoji: "📿",
    descAr: "يُحرم بالحج والعمرة معاً من الميقات دون فصل.",
    rulesAr: "يذبح الهدي. لا يتحلل بين العمرة والحج.",
    color: "#8b5cf6",
  },
];

export default function NusukSelectPage() {
  const [, setLocation] = useLocation();
  const { user, login, token } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<"ifrad" | "tamattu" | "qiran" | null>(null);
  const updateNusuk = useUpdateNusukType();

  const handleConfirm = () => {
    if (!selected) return;
    updateNusuk.mutate(
      { data: { nusukType: selected } },
      {
        onSuccess: (updatedUser) => {
          if (token) login(token, updatedUser);
          toast({ title: "تم تحديد نوع النسك", description: NUSUK_OPTIONS.find((o) => o.key === selected)?.titleAr });
          setLocation("/manasik");
        },
        onError: () => {
          toast({ title: "حدث خطأ", description: "الرجاء المحاولة مجدداً", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 text-center">
        <div className="text-4xl mb-3">🕌</div>
        <h1 className="text-2xl font-bold">اختر نوع نسكك</h1>
        <p className="text-sm opacity-80 mt-2">سيتم تخصيص قائمة مناسكك حسب نوع حجك</p>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {NUSUK_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSelected(opt.key)}
            className={`w-full text-right p-5 rounded-2xl border-2 transition-all ${
              selected === opt.key
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: opt.color + "22" }}
              >
                {opt.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selected === opt.key ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}
                  >
                    {selected === opt.key && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: opt.color }}>{opt.titleAr}</h2>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{opt.descAr}</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{opt.rulesAr}</p>
              </div>
            </div>
          </button>
        ))}

        {/* Maliki note */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-right">
          <p className="text-xs text-primary font-bold mb-1">🔖 ملاحظة مذهبية</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            التطبيق يتبع المذهب المالكي. أحكام كل نوع نسك ستُعرض بالترتيب الصحيح.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-card">
        <Button
          className="w-full h-12 text-base font-bold rounded-xl"
          disabled={!selected || updateNusuk.isPending}
          onClick={handleConfirm}
        >
          {updateNusuk.isPending ? "جاري الحفظ..." : "تأكيد الاختيار"}
        </Button>
        <button
          className="w-full mt-3 text-sm text-muted-foreground py-2"
          onClick={() => setLocation("/")}
        >
          تخطي الآن
        </button>
      </div>
    </div>
  );
}
