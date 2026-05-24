import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetDua, useAddDuaFavorite, useRemoveDuaFavorite, type DuaDetail } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, BookOpen, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DuaDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showTranslation, setShowTranslation] = useState(false);
  const [fontSize, setFontSize] = useState(24);

  const { data: dua, isLoading, refetch } = useGetDua(id!);
  const addFav = useAddDuaFavorite();
  const removeFav = useRemoveDuaFavorite();

  const handleFavorite = () => {
    if (!dua) return;
    if (dua.isFavorited) {
      removeFav.mutate({ id: id! }, { onSuccess: () => { refetch(); toast({ title: "تم الحذف من المفضلة" }); } });
    } else {
      addFav.mutate({ id: id! }, { onSuccess: () => { refetch(); toast({ title: "تمت الإضافة إلى المفضلة" }); } });
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="الدعاء">
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!dua) {
    return <AppLayout title="الدعاء"><div className="p-8 text-center text-muted-foreground">الدعاء غير موجود</div></AppLayout>;
  }

  const d = dua as DuaDetail & {
    category?: { nameAr: string; emoji: string; color: string } | null;
    related?: { id: string; titleAr: string; source?: string | null }[];
  };

  return (
    <AppLayout title={d.titleAr}>
      <div className="pb-6">
        {/* Category header bar */}
        {d.category && (
          <div className="h-1.5 w-full" style={{ backgroundColor: d.category.color }} />
        )}

        <div className="p-4 space-y-5">
          {/* Title + favorite */}
          <div className="flex items-start justify-between gap-3">
            <Button
              variant={d.isFavorited ? "default" : "outline"}
              size="icon"
              className="rounded-full shrink-0"
              onClick={handleFavorite}
              disabled={addFav.isPending || removeFav.isPending}
            >
              <Heart className={`w-4 h-4 ${d.isFavorited ? "fill-white" : ""}`} />
            </Button>
            <div className="text-right flex-1">
              <h1 className="text-xl font-bold">{d.titleAr}</h1>
              {d.category && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  {d.category.emoji} {d.category.nameAr}
                </span>
              )}
            </div>
          </div>

          {/* Font size controls */}
          <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" size="sm" className="w-8 h-8 p-0 rounded-full" onClick={() => setFontSize(Math.max(16, fontSize - 2))}>أ−</Button>
            <Button variant="outline" size="sm" className="w-8 h-8 p-0 rounded-full" onClick={() => setFontSize(Math.min(36, fontSize + 2))}>أ+</Button>
          </div>

          {/* Arabic Text — Main Card */}
          <Card className="bg-muted/30 border-2 border-primary/10">
            <CardContent className="p-6">
              <div
                className="text-foreground text-right space-y-3"
                style={{
                  fontFamily: "'Noto Naskh Arabic', serif",
                  fontSize: `${fontSize}px`,
                  direction: "rtl",
                  lineHeight: "2.2",
                }}
              >
                {d.arabicText.split(/(?<=\.)\s*/).filter(Boolean).map((sentence, i) => (
                  <p key={i}>{sentence}</p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Source */}
          {d.source && (
            <div className="flex items-center gap-2 justify-end">
              <p className="text-sm text-muted-foreground text-right">{d.source}</p>
              <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          )}

          {/* Translation toggle */}
          {(d.translationAr || d.translationEn) && (
            <div>
              <button
                className="flex items-center gap-2 text-sm text-primary font-medium w-full justify-end"
                onClick={() => setShowTranslation(!showTranslation)}
              >
                {showTranslation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <Globe className="w-4 h-4" />
                المعنى والترجمة
              </button>

              {showTranslation && (
                <Card className="mt-3 border-secondary/20 bg-secondary/5">
                  <CardContent className="p-4 space-y-3 text-right">
                    {d.translationAr && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">المعنى بالعربية</p>
                        <p className="text-sm leading-relaxed text-foreground/90">{d.translationAr}</p>
                      </div>
                    )}
                    {d.translationEn && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">English Translation</p>
                        <p className="text-sm leading-relaxed text-foreground/90" dir="ltr">{d.translationEn}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Related duas */}
          {d.related && d.related.length > 0 && (
            <div>
              <h3 className="text-base font-semibold mb-3 text-right">أدعية ذات صلة</h3>
              <div className="space-y-2">
                {(d.related as { id: string; titleAr: string; source?: string | null }[]).map((r) => (
                  <Card
                    key={r.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setLocation(`/duas/view/${r.id}`)}
                  >
                    <CardContent className="p-3 text-right">
                      <p className="text-sm font-medium">{r.titleAr}</p>
                      {r.source && <p className="text-xs text-muted-foreground mt-0.5">{r.source}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
