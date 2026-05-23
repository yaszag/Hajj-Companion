import { customFetch } from "@workspace/api-client-react";

// ═══════════════════════════════════════
// Khatma API
// ═══════════════════════════════════════

export interface KhatmaPlan {
  id: string;
  name: string;
  status: string;
  totalAyat: number;
  targetDays: number;
  startDate: string;
  endDate: string;
  currentSurahId: number;
  currentAyah: number;
  totalAyatRead: number;
  completedAt: string | null;
  createdAt: string;
  dailyTarget: number;
  daysRemaining: number;
  progressPercent: number;
  statusMessage: string;
  currentSurahName: string;
  currentJuz: number;
  todayAyatRead: number;
  todayTarget: number;
  todayJuzRead: number;
  dailyJuzTarget: number;
}

export interface Surah {
  id: number;
  nameAr: string;
  nameEn: string;
  ayatCount: number;
  revelationType: string;
  juzStart: number;
}

export const getActiveKhatma = () => customFetch<KhatmaPlan>("/api/khatma/active", { method: "GET" });

export const getSurahs = () => customFetch<Surah[]>("/api/quran/surahs", { method: "GET" });

export const createKhatma = (name: string, targetDays: number) =>
  customFetch<KhatmaPlan>("/api/khatma", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, targetDays }),
  });

export const logKhatmaReading = (planId: string, ayatRead: number, endSurahId: number, endAyah: number, note?: string) =>
  customFetch<KhatmaPlan>(`/api/khatma/${planId}/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ayatRead, endSurahId, endAyah, note }),
  });

export const cancelKhatma = (planId: string) =>
  customFetch<{ success: boolean }>(`/api/khatma/${planId}/cancel`, { method: "POST" });

export interface KhatmaLog {
  id: string;
  planId: string;
  date: string;
  ayatRead: number;
  startSurahId: number;
  startAyah: number;
  endSurahId: number;
  endAyah: number;
  note: string | null;
  createdAt: string;
}

export const getKhatmaLogs = (planId: string) => customFetch<KhatmaLog[]>(`/api/khatma/${planId}/logs`, { method: "GET" });

export const undoKhatmaLog = (planId: string, logId: string) =>
  customFetch<{ success: boolean }>(`/api/khatma/${planId}/logs/${logId}`, { method: "DELETE" });

// ═══════════════════════════════════════
// Tasbih API
// ═══════════════════════════════════════

export interface TasbihPreset {
  id: string;
  phraseAr: string;
  transliteration: string | null;
  translationAr: string | null;
  meaning: string | null;
  recommendedCount: number;
  category: string;
  timeOfDay: string | null;
  spiritualNote: string | null;
  orderIndex: number;
  isFeatured: boolean;
}

export interface TasbihSession {
  id: string;
  presetId: string;
  preset: TasbihPreset | null;
  targetCount: number;
  currentCount: number;
  roundsCompleted: number;
  totalCount: number;
  status: string;
  date: string;
  startedAt: string;
  completedAt: string | null;
}

export interface AdhkarItem {
  id: string;
  phraseAr: string;
  category: string;
  timeOfDay: string | null;
}

export const getTasbihPresets = () => customFetch<TasbihPreset[]>("/api/tasbih/presets", { method: "GET" });

export const getActiveTasbih = () => customFetch<TasbihSession>("/api/tasbih/active", { method: "GET" });

export const selectTasbih = (presetId: string) =>
  customFetch<TasbihSession>("/api/tasbih/select", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ presetId }),
  });

export const incrementTasbih = () => customFetch<TasbihSession>("/api/tasbih/increment", { method: "POST" });

export const resetTasbihRound = () => customFetch<TasbihSession>("/api/tasbih/reset-round", { method: "POST" });

export const getContextualAdhkar = () => customFetch<AdhkarItem[]>("/api/tasbih/contextual-adhkar", { method: "GET" });
