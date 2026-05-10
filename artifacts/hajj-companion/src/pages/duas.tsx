import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetDuaCategories, useGetDuas, type DuaCategory, type DuaListItem } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Star } from "lucide-react";

export default function DuasPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const { data: categories, isLoading: catLoading } = useGetDuaCategories();
  const { data: featured, isLoading: featLoading } = useGetDuas({ is_featured: "true", size: "6" } as Record<string, string>);

  const featuredItems = (featured as { content?: DuaListItem[] } | undefined)?.content ?? [];

  return (
    <AppLayout title="أدعية وأذكار">
      <div className="p-4 space-y-6 pb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن دعاء..."
            className="pr-9 text-right"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                setLocation(`/duas/search?q=${encodeURIComponent(search)}`);
              }
            }}
          />
        </div>

        {/* Featured */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h2 className="text-base font-semibold">أدعية مميزة</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {featLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="min-w-[250px] rounded-2xl overflow-hidden shrink-0">
                    <Skeleton className="h-24 w-full" />
                  </div>
                ))
              : featuredItems.map((dua) => (
                  <FeaturedCard key={dua.id} dua={dua} onPress={() => setLocation(`/duas/view/${dua.id}`)} />
                ))}
          </div>
        </section>

        {/* Categories */}
        <section>
          <h2 className="text-base font-semibold mb-3">التصنيفات</h2>
          {catLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(categories ?? []).map((cat) => (
                <CategoryCard key={cat.id} cat={cat} onPress={() => setLocation(`/duas/cat/${cat.id}`)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function FeaturedCard({ dua, onPress }: { dua: DuaListItem; onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className="min-w-[260px] rounded-2xl bg-primary text-primary-foreground p-4 text-right shrink-0 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md"
    >
      <p className="font-bold text-sm mb-2 line-clamp-1">{dua.titleAr}</p>
      <p className="text-xs opacity-80 line-clamp-3 leading-relaxed" style={{ fontFamily: "Cairo, serif" }}>
        {dua.arabicText}
      </p>
    </button>
  );
}

function CategoryCard({ cat, onPress }: { cat: DuaCategory; onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className="rounded-2xl p-4 text-right text-white hover:opacity-90 active:scale-[0.97] transition-all shadow-md flex flex-col justify-between h-24"
      style={{ backgroundColor: cat.color }}
    >
      <span className="text-2xl">{cat.emoji}</span>
      <div>
        <p className="text-sm font-bold line-clamp-1">{cat.nameAr}</p>
        <p className="text-[10px] opacity-80 mt-0.5">{cat.duasCount} دعاء</p>
      </div>
    </button>
  );
}
