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

// ═══════════════════════════════════════
// Arafah Plan API
// ═══════════════════════════════════════

export interface ArafahPlan {
  id: string;
  userId: string;
  year: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
  totalDhikrCount: number;
  totalDuasRead: number;
  goalsCompleted: number;
  reflection: string | null;
}

export interface ArafahTimeBlock {
  id: string;
  planId: string;
  labelAr: string;
  labelEn: string | null;
  startTime: string;
  endTime: string;
  orderIndex: number;
  moodColor: string | null;
}

export interface ArafahGoal {
  id: string;
  planId: string;
  blockId: string | null;
  goalType: string;
  targetType: string;
  targetValue: number;
  refType: string | null;
  refId: string | null;
  titleAr: string | null;
  arabicText: string | null;
  orderIndex: number;
  completed: boolean;
  completedAt: string | null;
  currentCount: number;
}

export interface ArafahDuaProgress {
  id: string;
  planId: string;
  duaId: string;
  status: string;
  lastPosition: number | null;
  readCount: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ArafahPlanData {
  plan: ArafahPlan;
  blocks: ArafahTimeBlock[];
  goals: ArafahGoal[];
  duaProgress: ArafahDuaProgress[];
}

export interface ArafahSessionState {
  userId: string;
  planId: string;
  activeScreen: string | null;
  activeGoalId: string | null;
  activeTasbeehPresetId: string | null;
  activeDuaId: string | null;
  activeDuaPosition: number | null;
  lastActiveAt: string;
}

export const getArafahPlan = () => customFetch<ArafahPlanData>("/api/arafah/plan", { method: "GET" });

export const incrementArafahGoal = (goalId: string) =>
  customFetch<ArafahGoal>(`/api/arafah/goals/${goalId}/increment`, { method: "POST" });

export const completeArafahGoal = (goalId: string) =>
  customFetch<ArafahGoal>(`/api/arafah/goals/${goalId}/complete`, { method: "POST" });

export const updateArafahDuaProgress = (duaId: string, data: { planId: string; status?: string; lastPosition?: number }) =>
  customFetch<ArafahDuaProgress>(`/api/arafah/dua/${duaId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const getArafahSession = () => customFetch<ArafahSessionState | null>("/api/arafah/session", { method: "GET" });

export const saveArafahSession = (data: Partial<ArafahSessionState>) =>
  customFetch<ArafahSessionState>("/api/arafah/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const getArafahGoal = (goalId: string) =>
  customFetch<ArafahGoal>(`/api/arafah/goals/${goalId}`, { method: "GET" });

export const revertArafahGoal = (goalId: string) =>
  customFetch<ArafahGoal>(`/api/arafah/goals/${goalId}/revert`, { method: "POST" });

export const deleteArafahGoal = (goalId: string) =>
  customFetch<{ success: boolean }>(`/api/arafah/goals/${goalId}`, { method: "DELETE" });

export const createArafahGoal = (data: {
  planId: string;
  blockId?: string;
  goalType: string;
  targetValue: number;
  titleAr: string;
  arabicText?: string;
  refType?: string;
  refId?: string;
}) =>
  customFetch<ArafahGoal>("/api/arafah/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
