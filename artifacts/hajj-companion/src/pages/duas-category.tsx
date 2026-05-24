import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetDuaCategories, useGetDuas, type DuaListItem } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

export default function DuasCategoryPage() {
  const { categoryId } = useParams();
  const [, setLocation] = useLocation();

  const { data: categories } = useGetDuaCategories();
  const { data: duaPage, isLoading } = useGetDuas({ category_id: categoryId, size: "50" } as Record<string, string>);

  const category = categories?.find((c) => c.id === categoryId);
  const duas = (duaPage as { content?: DuaListItem[] } | undefined)?.content ?? [];

  return (
    <AppLayout title={category?.nameAr ?? "الأدعية"}>
      <div className="pb-6">
        {/* Category header */}
        {category && (
          <div
            className="p-6 text-white text-right mb-4"
            style={{ backgroundColor: category.color }}
          >
            <div className="text-4xl mb-2">{category.emoji}</div>
            <h1 className="text-2xl font-bold">{category.nameAr}</h1>
            {category.descriptionAr && (
              <p className="text-sm opacity-80 mt-1 leading-relaxed">{category.descriptionAr}</p>
            )}
            <p className="text-xs opacity-60 mt-2">{category.duasCount} دعاء</p>
          </div>
        )}

        {/* Duas list */}
        <div className="px-4 space-y-3">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
              ))
            : duas.map((dua) => (
                <DuaCard key={dua.id} dua={dua} onPress={() => setLocation(`/duas/view/${dua.id}`)} />
              ))}

          {!isLoading && duas.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد أدعية في هذا التصنيف حالياً
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function DuaCard({ dua, onPress }: { dua: DuaListItem; onPress: () => void }) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md active:scale-[0.99] transition-all border-border"
      onClick={onPress}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <ChevronLeft className="w-4 h-4 text-muted-foreground mt-1 shrink-0 rotate-180" />
          <div className="flex-1 text-right">
            <p className="font-bold text-sm text-foreground mb-2">{dua.titleAr}</p>
            <div
              className="text-base leading-relaxed text-foreground/80 line-clamp-2 space-y-1"
              style={{ fontFamily: "'Noto Naskh Arabic', serif", direction: "rtl" }}
            >
              {dua.arabicText.split(/(?<=\.)\s*/).filter(Boolean).map((sentence, i) => (
                <p key={i}>{sentence}</p>
              ))}
            </div>
            {dua.source && (
              <p className="text-xs text-muted-foreground mt-2 text-right">{dua.source}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
