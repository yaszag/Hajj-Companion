import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createArafahGoal, getTasbihPresets, type ArafahTimeBlock, type TasbihPreset } from "@/lib/api-client";
import { getDuasByMansak, type DuaListItem } from "@workspace/api-client-react";
import { X, Search, Check, Plus, BookOpen, Hash, Quote, BookText } from "lucide-react";

interface AddGoalModalProps {
  open: boolean;
  onClose: () => void;
  planId: string;
  blocks: ArafahTimeBlock[];
  onGoalCreated: () => void;
}

type GoalTab = "tasbeeh" | "dua" | "quran";

const PRESET_TASBIH: { phraseAr: string; count: number }[] = [
  { phraseAr: "سبحان الله", count: 100 },
  { phraseAr: "الحمد لله", count: 100 },
  { phraseAr: "الله أكبر", count: 100 },
  { phraseAr: "لا إله إلا الله", count: 100 },
  { phraseAr: "أستغفر الله", count: 100 },
  { phraseAr: "سبحان الله وبحمده", count: 100 },
  { phraseAr: "اللهم صل على محمد", count: 100 },
  { phraseAr: "لا حول ولا قوة إلا بالله", count: 100 },
  { phraseAr: "حسبنا الله ونعم الوكيل", count: 100 },
  { phraseAr: "ربنا آتنا في الدنيا حسنة", count: 33 },
];

export default function AddGoalModal({ open, onClose, planId, blocks, onGoalCreated }: AddGoalModalProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<GoalTab>("tasbeeh");
  const [selectedBlock, setSelectedBlock] = useState(blocks[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  /* tasbih state */
  const [presets, setPresets] = useState<TasbihPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<TasbihPreset | null>(null);
  const [customCount, setCustomCount] = useState("100");

  /* dua state */
  const [arafahDuas, setArafahDuas] = useState<DuaListItem[]>([]);
  const [duaLoading, setDuaLoading] = useState(false);
  const [selectedDua, setSelectedDua] = useState<DuaListItem | null>(null);
  const [duaSearch, setDuaSearch] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customArabic, setCustomArabic] = useState("");

  /* quran state */
  const [quranRef, setQuranRef] = useState("");
  const [quranCount, setQuranCount] = useState("1");

  useEffect(() => {
    if (open) {
      getTasbihPresets().then(setPresets).catch(() => {});
      setSelectedBlock(blocks[0]?.id || "");
      setSelectedPreset(null);
      setCustomCount("100");
      setSelectedDua(null);
      setDuaSearch("");
      setCustomTitle("");
      setCustomArabic("");
      setSearch("");
      setQuranRef("");
      setQuranCount("1");
      setDuaLoading(true);
      getDuasByMansak("wuquf_arafah")
        .then(setArafahDuas)
        .catch(() => {})
        .finally(() => setDuaLoading(false));
    }
  }, [open, blocks]);

  useEffect(() => {
    setSelectedDua(null);
    setDuaSearch("");
    setCustomTitle("");
    setCustomArabic("");
    setSearch("");
    setQuranRef("");
    setQuranCount("1");
    setSelectedPreset(null);
    setCustomCount("100");
  }, [tab]);

  if (!open) return null;

  const filteredPresets = presets.filter((p) =>
    p.phraseAr.includes(search) || p.category.includes(search)
  );

  const handleSelectDua = (dua: DuaListItem) => {
    setSelectedDua(dua);
    setCustomTitle(dua.titleAr);
    setCustomArabic(dua.arabicText);
  };

  const filteredArafahDuas = arafahDuas.filter((d) =>
    d.titleAr.includes(duaSearch) || d.arabicText.includes(duaSearch)
  );

  const handleCreate = async () => {
    if (!selectedBlock) {
      toast({ title: "اختر فترة زمنية", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (tab === "tasbeeh") {
        const count = parseInt(customCount) || 100;
        const phrase = selectedPreset?.phraseAr || customTitle || "تسبيح";
        await createArafahGoal({
          planId,
          blockId: selectedBlock,
          goalType: "tasbeeh",
          targetValue: count,
          titleAr: `${phrase} × ${count}`,
          arabicText: phrase,
          refType: selectedPreset ? "tasbih_preset" : "manual",
          refId: selectedPreset?.id || undefined,
        });
      } else if (tab === "dua") {
        if (!customTitle) {
          toast({ title: "أدخل عنوان الدعاء", variant: "destructive" });
          return;
        }
        await createArafahGoal({
          planId,
          blockId: selectedBlock,
          goalType: "dua_read",
          targetValue: 1,
          titleAr: customTitle,
          arabicText: customArabic || undefined,
          refType: "manual",
        });
      } else if (tab === "quran") {
        if (!quranRef) {
          toast({ title: "أدخل الآية", variant: "destructive" });
          return;
        }
        const count = parseInt(quranCount) || 1;
        await createArafahGoal({
          planId,
          blockId: selectedBlock,
          goalType: "quran",
          targetValue: count,
          titleAr: `قراءة ${quranRef}`,
          arabicText: quranRef,
          refType: "quran",
        });
      }
      toast({ title: "تمت إضافة الهدف ✅" });
      onGoalCreated();
      onClose();
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col mb-14">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b">
          <button onClick={onClose}><X className="w-5 h-5" /></button>
          <h2 className="text-base font-bold">إضافة هدف جديد</h2>
          <div className="w-5" />
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex border-b">
          {[
            { key: "tasbeeh" as GoalTab, label: "تسبيح", icon: Hash },
            { key: "dua" as GoalTab, label: "دعاء", icon: Quote },
            { key: "quran" as GoalTab, label: "قرآن", icon: BookOpen },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Time block picker */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">الفترة الزمنية</label>
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
            >
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>{b.labelAr} ({b.startTime} - {b.endTime})</option>
              ))}
            </select>
          </div>

          {/* Tasbeeh tab */}
          {tab === "tasbeeh" && (
            <>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن تسبيحة..."
                  className="pr-9 text-right"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
                {filteredPresets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPreset(p)}
                    className={`flex items-center justify-between p-3 rounded-xl text-right transition-colors ${
                      selectedPreset?.id === p.id
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{p.phraseAr}</p>
                      <p className="text-[10px] text-muted-foreground">{p.category}</p>
                    </div>
                    {selectedPreset?.id === p.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
              {selectedPreset && (
                <div className="flex items-center gap-3">
                  <label className="text-xs text-muted-foreground shrink-0">العدد:</label>
                  <Input
                    type="number"
                    value={customCount}
                    onChange={(e) => setCustomCount(e.target.value)}
                    className="text-center"
                    min={1}
                  />
                </div>
              )}
              {!selectedPreset && (
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_TASBIH.slice(0, 6).map((p) => (
                    <button
                      key={p.phraseAr}
                      onClick={() => {
                        setCustomCount(String(p.count));
                        setCustomTitle(p.phraseAr);
                        setSelectedPreset(null);
                      }}
                      className={`p-2 rounded-xl text-center text-sm transition-colors ${
                        customTitle === p.phraseAr ? "bg-primary/10 border border-primary/30" : "bg-muted/30"
                      }`}
                    >
                      {p.phraseAr}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Dua tab */}
          {tab === "dua" && (
            <>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث في أدعية عرفات..."
                  className="pr-9 text-right"
                  value={duaSearch}
                  onChange={(e) => setDuaSearch(e.target.value)}
                />
              </div>

              {duaLoading ? (
                <div className="text-center py-6 text-sm text-muted-foreground">جاري تحميل الأدعية...</div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {filteredArafahDuas.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      {duaSearch ? "لا توجد نتائج" : "لا توجد أدعية"}
                    </p>
                  ) : (
                    filteredArafahDuas.map((dua) => (
                      <button
                        key={dua.id}
                        onClick={() => handleSelectDua(dua)}
                        className={`w-full flex items-start gap-2 p-3 rounded-xl text-right transition-colors ${
                          selectedDua?.id === dua.id
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        <BookText className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{dua.titleAr}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            {dua.arabicText.substring(0, 80)}...
                          </p>
                        </div>
                        {selectedDua?.id === dua.id && <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                      </button>
                    ))
                  )}
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-2 text-[10px] text-muted-foreground">أو أدخل يدويًا</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">عنوان الدعاء</label>
                <Input
                  placeholder="مثال: دعاء عرفة الطويل"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="text-right"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">نص الدعاء (اختياري)</label>
                <textarea
                  placeholder="الصق نص الدعاء هنا..."
                  value={customArabic}
                  onChange={(e) => setCustomArabic(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-right resize-none"
                />
              </div>
            </>
          )}

          {/* Quran tab */}
          {tab === "quran" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">الآية أو السورة</label>
                <Input
                  placeholder="مثال: سورة الفاتحة, آية الكرسي, سورة يس"
                  value={quranRef}
                  onChange={(e) => setQuranRef(e.target.value)}
                  className="text-right"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground shrink-0">عدد المرات:</label>
                <Input
                  type="number"
                  value={quranCount}
                  onChange={(e) => setQuranCount(e.target.value)}
                  className="text-center"
                  min={1}
                />
              </div>
            </>
          )}
        </div>

        {/* Sticky bottom button - above nav bar */}
        <div className="shrink-0 bg-card p-4 border-t" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="w-full h-12 text-base font-bold"
          >
            {loading ? "جاري الإضافة..." : <><Plus className="w-5 h-5 ml-2" />إضافة إلى الخطة</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
