import { Router } from "express";
import { eq, and, desc, count } from "drizzle-orm";
import {
  db,
  quranSurahsTable,
  quranJuzTable,
  khatmaPlansTable,
  khatmaDailyLogsTable,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

const TOTAL_AYAT = 6236;

const SURAH_DATA = [
  { id: 1, nameAr: "الفاتحة", nameEn: "Al-Fatiha", ayatCount: 7, revelationType: "meccan", juzStart: 1 },
  { id: 2, nameAr: "البقرة", nameEn: "Al-Baqara", ayatCount: 286, revelationType: "medinan", juzStart: 1 },
  { id: 3, nameAr: "آل عمران", nameEn: "Aal-Imran", ayatCount: 200, revelationType: "medinan", juzStart: 3 },
  { id: 4, nameAr: "النساء", nameEn: "An-Nisa", ayatCount: 176, revelationType: "medinan", juzStart: 4 },
  { id: 5, nameAr: "المائدة", nameEn: "Al-Ma'ida", ayatCount: 120, revelationType: "medinan", juzStart: 6 },
  { id: 6, nameAr: "الأنعام", nameEn: "Al-An'am", ayatCount: 165, revelationType: "meccan", juzStart: 7 },
  { id: 7, nameAr: "الأعراف", nameEn: "Al-A'raf", ayatCount: 206, revelationType: "meccan", juzStart: 8 },
  { id: 8, nameAr: "الأنفال", nameEn: "Al-Anfal", ayatCount: 75, revelationType: "medinan", juzStart: 9 },
  { id: 9, nameAr: "التوبة", nameEn: "At-Tawba", ayatCount: 129, revelationType: "medinan", juzStart: 10 },
  { id: 10, nameAr: "يونس", nameEn: "Yunus", ayatCount: 109, revelationType: "meccan", juzStart: 11 },
  { id: 11, nameAr: "هود", nameEn: "Hud", ayatCount: 123, revelationType: "meccan", juzStart: 11 },
  { id: 12, nameAr: "يوسف", nameEn: "Yusuf", ayatCount: 111, revelationType: "meccan", juzStart: 12 },
  { id: 13, nameAr: "الرعد", nameEn: "Ar-Ra'd", ayatCount: 43, revelationType: "medinan", juzStart: 13 },
  { id: 14, nameAr: "إبراهيم", nameEn: "Ibrahim", ayatCount: 52, revelationType: "meccan", juzStart: 13 },
  { id: 15, nameAr: "الحجر", nameEn: "Al-Hijr", ayatCount: 99, revelationType: "meccan", juzStart: 14 },
  { id: 16, nameAr: "النحل", nameEn: "An-Nahl", ayatCount: 128, revelationType: "meccan", juzStart: 14 },
  { id: 17, nameAr: "الإسراء", nameEn: "Al-Isra", ayatCount: 111, revelationType: "meccan", juzStart: 15 },
  { id: 18, nameAr: "الكهف", nameEn: "Al-Kahf", ayatCount: 110, revelationType: "meccan", juzStart: 15 },
  { id: 19, nameAr: "مريم", nameEn: "Maryam", ayatCount: 98, revelationType: "meccan", juzStart: 16 },
  { id: 20, nameAr: "طه", nameEn: "Ta-Ha", ayatCount: 135, revelationType: "meccan", juzStart: 16 },
  { id: 21, nameAr: "الأنبياء", nameEn: "Al-Anbiya", ayatCount: 112, revelationType: "meccan", juzStart: 17 },
  { id: 22, nameAr: "الحج", nameEn: "Al-Hajj", ayatCount: 78, revelationType: "medinan", juzStart: 17 },
  { id: 23, nameAr: "المؤمنون", nameEn: "Al-Mu'minun", ayatCount: 118, revelationType: "meccan", juzStart: 18 },
  { id: 24, nameAr: "النور", nameEn: "An-Nur", ayatCount: 64, revelationType: "medinan", juzStart: 18 },
  { id: 25, nameAr: "الفرقان", nameEn: "Al-Furqan", ayatCount: 77, revelationType: "meccan", juzStart: 18 },
  { id: 26, nameAr: "الشعراء", nameEn: "Ash-Shu'ara", ayatCount: 227, revelationType: "meccan", juzStart: 19 },
  { id: 27, nameAr: "النمل", nameEn: "An-Naml", ayatCount: 93, revelationType: "meccan", juzStart: 19 },
  { id: 28, nameAr: "القصص", nameEn: "Al-Qasas", ayatCount: 88, revelationType: "meccan", juzStart: 20 },
  { id: 29, nameAr: "العنكبوت", nameEn: "Al-Ankabut", ayatCount: 69, revelationType: "meccan", juzStart: 20 },
  { id: 30, nameAr: "الروم", nameEn: "Ar-Rum", ayatCount: 60, revelationType: "meccan", juzStart: 21 },
  { id: 31, nameAr: "لقمان", nameEn: "Luqman", ayatCount: 34, revelationType: "meccan", juzStart: 21 },
  { id: 32, nameAr: "السجدة", nameEn: "As-Sajda", ayatCount: 30, revelationType: "meccan", juzStart: 21 },
  { id: 33, nameAr: "الأحزاب", nameEn: "Al-Ahzab", ayatCount: 73, revelationType: "medinan", juzStart: 21 },
  { id: 34, nameAr: "سبأ", nameEn: "Saba", ayatCount: 54, revelationType: "meccan", juzStart: 22 },
  { id: 35, nameAr: "فاطر", nameEn: "Fatir", ayatCount: 45, revelationType: "meccan", juzStart: 22 },
  { id: 36, nameAr: "يس", nameEn: "Ya-Sin", ayatCount: 83, revelationType: "meccan", juzStart: 22 },
  { id: 37, nameAr: "الصافات", nameEn: "As-Saffat", ayatCount: 182, revelationType: "meccan", juzStart: 23 },
  { id: 38, nameAr: "ص", nameEn: "Sad", ayatCount: 88, revelationType: "meccan", juzStart: 23 },
  { id: 39, nameAr: "الزمر", nameEn: "Az-Zumar", ayatCount: 75, revelationType: "meccan", juzStart: 23 },
  { id: 40, nameAr: "غافر", nameEn: "Ghafir", ayatCount: 85, revelationType: "meccan", juzStart: 24 },
  { id: 41, nameAr: "فصلت", nameEn: "Fussilat", ayatCount: 54, revelationType: "meccan", juzStart: 24 },
  { id: 42, nameAr: "الشورى", nameEn: "Ash-Shura", ayatCount: 53, revelationType: "meccan", juzStart: 25 },
  { id: 43, nameAr: "الزخرف", nameEn: "Az-Zukhruf", ayatCount: 89, revelationType: "meccan", juzStart: 25 },
  { id: 44, nameAr: "الدخان", nameEn: "Ad-Dukhan", ayatCount: 59, revelationType: "meccan", juzStart: 25 },
  { id: 45, nameAr: "الجاثية", nameEn: "Al-Jathiya", ayatCount: 37, revelationType: "meccan", juzStart: 25 },
  { id: 46, nameAr: "الأحقاف", nameEn: "Al-Ahqaf", ayatCount: 35, revelationType: "meccan", juzStart: 26 },
  { id: 47, nameAr: "محمد", nameEn: "Muhammad", ayatCount: 38, revelationType: "medinan", juzStart: 26 },
  { id: 48, nameAr: "الفتح", nameEn: "Al-Fath", ayatCount: 29, revelationType: "medinan", juzStart: 26 },
  { id: 49, nameAr: "الحجرات", nameEn: "Al-Hujurat", ayatCount: 18, revelationType: "medinan", juzStart: 26 },
  { id: 50, nameAr: "ق", nameEn: "Qaf", ayatCount: 45, revelationType: "meccan", juzStart: 26 },
  { id: 51, nameAr: "الذاريات", nameEn: "Adh-Dhariyat", ayatCount: 60, revelationType: "meccan", juzStart: 26 },
  { id: 52, nameAr: "الطور", nameEn: "At-Tur", ayatCount: 49, revelationType: "meccan", juzStart: 27 },
  { id: 53, nameAr: "النجم", nameEn: "An-Najm", ayatCount: 62, revelationType: "meccan", juzStart: 27 },
  { id: 54, nameAr: "القمر", nameEn: "Al-Qamar", ayatCount: 55, revelationType: "meccan", juzStart: 27 },
  { id: 55, nameAr: "الرحمن", nameEn: "Ar-Rahman", ayatCount: 78, revelationType: "medinan", juzStart: 27 },
  { id: 56, nameAr: "الواقعة", nameEn: "Al-Waqi'a", ayatCount: 96, revelationType: "meccan", juzStart: 27 },
  { id: 57, nameAr: "الحديد", nameEn: "Al-Hadid", ayatCount: 29, revelationType: "medinan", juzStart: 27 },
  { id: 58, nameAr: "المجادلة", nameEn: "Al-Mujadila", ayatCount: 22, revelationType: "medinan", juzStart: 28 },
  { id: 59, nameAr: "الحشر", nameEn: "Al-Hashr", ayatCount: 24, revelationType: "medinan", juzStart: 28 },
  { id: 60, nameAr: "الممتحنة", nameEn: "Al-Mumtahina", ayatCount: 13, revelationType: "medinan", juzStart: 28 },
  { id: 61, nameAr: "الصف", nameEn: "As-Saff", ayatCount: 14, revelationType: "medinan", juzStart: 28 },
  { id: 62, nameAr: "الجمعة", nameEn: "Al-Jumu'a", ayatCount: 11, revelationType: "medinan", juzStart: 28 },
  { id: 63, nameAr: "المنافقون", nameEn: "Al-Munafiqun", ayatCount: 11, revelationType: "medinan", juzStart: 28 },
  { id: 64, nameAr: "التغابن", nameEn: "At-Taghabun", ayatCount: 18, revelationType: "medinan", juzStart: 28 },
  { id: 65, nameAr: "الطلاق", nameEn: "At-Talaq", ayatCount: 12, revelationType: "medinan", juzStart: 28 },
  { id: 66, nameAr: "التحريم", nameEn: "At-Tahrim", ayatCount: 12, revelationType: "medinan", juzStart: 28 },
  { id: 67, nameAr: "الملك", nameEn: "Al-Mulk", ayatCount: 30, revelationType: "meccan", juzStart: 29 },
  { id: 68, nameAr: "القلم", nameEn: "Al-Qalam", ayatCount: 52, revelationType: "meccan", juzStart: 29 },
  { id: 69, nameAr: "الحاقة", nameEn: "Al-Haqqa", ayatCount: 52, revelationType: "meccan", juzStart: 29 },
  { id: 70, nameAr: "المعارج", nameEn: "Al-Ma'arij", ayatCount: 44, revelationType: "meccan", juzStart: 29 },
  { id: 71, nameAr: "نوح", nameEn: "Nuh", ayatCount: 28, revelationType: "meccan", juzStart: 29 },
  { id: 72, nameAr: "الجن", nameEn: "Al-Jinn", ayatCount: 28, revelationType: "meccan", juzStart: 29 },
  { id: 73, nameAr: "المزمل", nameEn: "Al-Muzzammil", ayatCount: 20, revelationType: "meccan", juzStart: 29 },
  { id: 74, nameAr: "المدثر", nameEn: "Al-Muddaththir", ayatCount: 56, revelationType: "meccan", juzStart: 29 },
  { id: 75, nameAr: "القيامة", nameEn: "Al-Qiyama", ayatCount: 40, revelationType: "meccan", juzStart: 29 },
  { id: 76, nameAr: "الإنسان", nameEn: "Al-Insan", ayatCount: 31, revelationType: "medinan", juzStart: 29 },
  { id: 77, nameAr: "المرسلات", nameEn: "Al-Mursalat", ayatCount: 50, revelationType: "meccan", juzStart: 29 },
  { id: 78, nameAr: "النبأ", nameEn: "An-Naba", ayatCount: 40, revelationType: "meccan", juzStart: 30 },
  { id: 79, nameAr: "النازعات", nameEn: "An-Nazi'at", ayatCount: 46, revelationType: "meccan", juzStart: 30 },
  { id: 80, nameAr: "عبس", nameEn: "Abasa", ayatCount: 42, revelationType: "meccan", juzStart: 30 },
  { id: 81, nameAr: "التكوير", nameEn: "At-Takwir", ayatCount: 29, revelationType: "meccan", juzStart: 30 },
  { id: 82, nameAr: "الانفطار", nameEn: "Al-Infitar", ayatCount: 19, revelationType: "meccan", juzStart: 30 },
  { id: 83, nameAr: "المطففين", nameEn: "Al-Mutaffifin", ayatCount: 36, revelationType: "meccan", juzStart: 30 },
  { id: 84, nameAr: "الانشقاق", nameEn: "Al-Inshiqaq", ayatCount: 25, revelationType: "meccan", juzStart: 30 },
  { id: 85, nameAr: "البروج", nameEn: "Al-Buruj", ayatCount: 22, revelationType: "meccan", juzStart: 30 },
  { id: 86, nameAr: "الطارق", nameEn: "At-Tariq", ayatCount: 17, revelationType: "meccan", juzStart: 30 },
  { id: 87, nameAr: "الأعلى", nameEn: "Al-A'la", ayatCount: 19, revelationType: "meccan", juzStart: 30 },
  { id: 88, nameAr: "الغاشية", nameEn: "Al-Ghashiya", ayatCount: 26, revelationType: "meccan", juzStart: 30 },
  { id: 89, nameAr: "الفجر", nameEn: "Al-Fajr", ayatCount: 30, revelationType: "meccan", juzStart: 30 },
  { id: 90, nameAr: "البلد", nameEn: "Al-Balad", ayatCount: 20, revelationType: "meccan", juzStart: 30 },
  { id: 91, nameAr: "الشمس", nameEn: "Ash-Shams", ayatCount: 15, revelationType: "meccan", juzStart: 30 },
  { id: 92, nameAr: "الليل", nameEn: "Al-Layl", ayatCount: 21, revelationType: "meccan", juzStart: 30 },
  { id: 93, nameAr: "الضحى", nameEn: "Ad-Duha", ayatCount: 11, revelationType: "meccan", juzStart: 30 },
  { id: 94, nameAr: "الشرح", nameEn: "Ash-Sharh", ayatCount: 8, revelationType: "meccan", juzStart: 30 },
  { id: 95, nameAr: "التين", nameEn: "At-Tin", ayatCount: 8, revelationType: "meccan", juzStart: 30 },
  { id: 96, nameAr: "العلق", nameEn: "Al-Alaq", ayatCount: 19, revelationType: "meccan", juzStart: 30 },
  { id: 97, nameAr: "القدر", nameEn: "Al-Qadr", ayatCount: 5, revelationType: "meccan", juzStart: 30 },
  { id: 98, nameAr: "البينة", nameEn: "Al-Bayyina", ayatCount: 8, revelationType: "medinan", juzStart: 30 },
  { id: 99, nameAr: "الزلزلة", nameEn: "Az-Zalzala", ayatCount: 8, revelationType: "medinan", juzStart: 30 },
  { id: 100, nameAr: "العاديات", nameEn: "Al-Adiyat", ayatCount: 11, revelationType: "meccan", juzStart: 30 },
  { id: 101, nameAr: "القارعة", nameEn: "Al-Qari'a", ayatCount: 11, revelationType: "meccan", juzStart: 30 },
  { id: 102, nameAr: "التكاثر", nameEn: "At-Takathur", ayatCount: 8, revelationType: "meccan", juzStart: 30 },
  { id: 103, nameAr: "العصر", nameEn: "Al-Asr", ayatCount: 3, revelationType: "meccan", juzStart: 30 },
  { id: 104, nameAr: "الهمزة", nameEn: "Al-Humaza", ayatCount: 9, revelationType: "meccan", juzStart: 30 },
  { id: 105, nameAr: "الفيل", nameEn: "Al-Fil", ayatCount: 5, revelationType: "meccan", juzStart: 30 },
  { id: 106, nameAr: "قريش", nameEn: "Quraysh", ayatCount: 4, revelationType: "meccan", juzStart: 30 },
  { id: 107, nameAr: "الماعون", nameEn: "Al-Ma'un", ayatCount: 7, revelationType: "meccan", juzStart: 30 },
  { id: 108, nameAr: "الكوثر", nameEn: "Al-Kawthar", ayatCount: 3, revelationType: "meccan", juzStart: 30 },
  { id: 109, nameAr: "الكافرون", nameEn: "Al-Kafirun", ayatCount: 6, revelationType: "meccan", juzStart: 30 },
  { id: 110, nameAr: "النصر", nameEn: "An-Nasr", ayatCount: 3, revelationType: "medinan", juzStart: 30 },
  { id: 111, nameAr: "المسد", nameEn: "Al-Masad", ayatCount: 5, revelationType: "meccan", juzStart: 30 },
  { id: 112, nameAr: "الإخلاص", nameEn: "Al-Ikhlas", ayatCount: 4, revelationType: "meccan", juzStart: 30 },
  { id: 113, nameAr: "الفلق", nameEn: "Al-Falaq", ayatCount: 5, revelationType: "meccan", juzStart: 30 },
  { id: 114, nameAr: "الناس", nameEn: "An-Nas", ayatCount: 5, revelationType: "meccan", juzStart: 30 },
];

const JUZ_DATA = [
  { juzNumber: 1, startSurahId: 1, startAyah: 1, endSurahId: 2, endAyah: 141, totalAyat: 148 },
  { juzNumber: 2, startSurahId: 2, startAyah: 142, endSurahId: 2, endAyah: 252, totalAyat: 111 },
  { juzNumber: 3, startSurahId: 2, startAyah: 253, endSurahId: 2, endAyah: 286, totalAyat: 200 },
  { juzNumber: 4, startSurahId: 3, startAyah: 1, endSurahId: 3, endAyah: 92, totalAyat: 92 },
  { juzNumber: 5, startSurahId: 3, startAyah: 93, endSurahId: 4, endAyah: 23, totalAyat: 123 },
  { juzNumber: 6, startSurahId: 4, startAyah: 24, endSurahId: 4, endAyah: 147, totalAyat: 124 },
  { juzNumber: 7, startSurahId: 4, startAyah: 148, endSurahId: 5, endAyah: 81, totalAyat: 110 },
  { juzNumber: 8, startSurahId: 5, startAyah: 82, endSurahId: 6, endAyah: 110, totalAyat: 130 },
  { juzNumber: 9, startSurahId: 6, startAyah: 111, endSurahId: 7, endAyah: 87, totalAyat: 133 },
  { juzNumber: 10, startSurahId: 7, startAyah: 88, endSurahId: 8, endAyah: 40, totalAyat: 115 },
  { juzNumber: 11, startSurahId: 8, startAyah: 41, endSurahId: 9, endAyah: 92, totalAyat: 128 },
  { juzNumber: 12, startSurahId: 9, startAyah: 93, endSurahId: 11, endAyah: 5, totalAyat: 133 },
  { juzNumber: 13, startSurahId: 11, startAyah: 6, endSurahId: 12, endAyah: 52, totalAyat: 163 },
  { juzNumber: 14, startSurahId: 12, startAyah: 53, endSurahId: 14, endAyah: 52, totalAyat: 162 },
  { juzNumber: 15, startSurahId: 15, startAyah: 1, endSurahId: 16, endAyah: 128, totalAyat: 207 },
  { juzNumber: 16, startSurahId: 17, startAyah: 1, endSurahId: 18, endAyah: 74, totalAyat: 147 },
  { juzNumber: 17, startSurahId: 18, startAyah: 75, endSurahId: 21, endAyah: 1, totalAyat: 140 },
  { juzNumber: 18, startSurahId: 21, startAyah: 2, endSurahId: 23, endAyah: 118, totalAyat: 166 },
  { juzNumber: 19, startSurahId: 24, startAyah: 1, endSurahId: 25, endAyah: 20, totalAyat: 140 },
  { juzNumber: 20, startSurahId: 25, startAyah: 21, endSurahId: 27, endAyah: 55, totalAyat: 156 },
  { juzNumber: 21, startSurahId: 27, startAyah: 56, endSurahId: 29, endAyah: 45, totalAyat: 141 },
  { juzNumber: 22, startSurahId: 29, startAyah: 46, endSurahId: 33, endAyah: 30, totalAyat: 183 },
  { juzNumber: 23, startSurahId: 33, startAyah: 31, endSurahId: 36, endAyah: 27, totalAyat: 164 },
  { juzNumber: 24, startSurahId: 36, startAyah: 28, endSurahId: 39, endAyah: 31, totalAyat: 167 },
  { juzNumber: 25, startSurahId: 39, startAyah: 32, endSurahId: 41, endAyah: 46, totalAyat: 158 },
  { juzNumber: 26, startSurahId: 41, startAyah: 47, endSurahId: 46, endAyah: 35, totalAyat: 162 },
  { juzNumber: 27, startSurahId: 47, startAyah: 1, endSurahId: 51, endAyah: 30, totalAyat: 183 },
  { juzNumber: 28, startSurahId: 51, startAyah: 31, endSurahId: 58, endAyah: 6, totalAyat: 183 },
  { juzNumber: 29, startSurahId: 58, startAyah: 7, endSurahId: 67, endAyah: 30, totalAyat: 215 },
  { juzNumber: 30, startSurahId: 67, startAyah: 31, endSurahId: 114, endAyah: 5, totalAyat: 564 },
];

function getSurahById(id: number) {
  return SURAH_DATA.find((s) => s.id === id);
}

function getJuzForPosition(surahId: number, ayah: number): number {
  let cumulativeAyat = 0;
  for (const surah of SURAH_DATA) {
    if (surah.id === surahId) {
      cumulativeAyat += ayah;
      break;
    }
    cumulativeAyat += surah.ayatCount;
  }

  let juzCumulative = 0;
  for (const juz of JUZ_DATA) {
    juzCumulative += juz.totalAyat;
    if (cumulativeAyat <= juzCumulative) return juz.juzNumber;
  }
  return 30;
}

async function seedQuranData() {
  const [surahCount] = await db
    .select({ count: count() })
    .from(quranSurahsTable);

  if (Number(surahCount.count) > 0) return;

  await db.insert(quranSurahsTable).values(SURAH_DATA);
  await db.insert(quranJuzTable).values(JUZ_DATA);
}

seedQuranData().catch(console.error);

router.get("/quran/surahs", requireAuth, async (req, res): Promise<void> => {
  const surahs = await db.select().from(quranSurahsTable).orderBy(quranSurahsTable.id);
  res.json(surahs);
});

router.get("/quran/juz", requireAuth, async (req, res): Promise<void> => {
  const juz = await db.select().from(quranJuzTable).orderBy(quranJuzTable.juzNumber);
  res.json(juz);
});

router.post("/khatma", requireAuth, async (req, res): Promise<void> => {
  const { name, targetDays } = req.body as { name?: string; targetDays: number };

  if (!targetDays || targetDays < 1 || targetDays > 365) {
    res.status(400).json({ error: "المدة يجب أن تكون بين يوم واحد و 365 يوماً" });
    return;
  }

  const existingActive = await db
    .select({ id: khatmaPlansTable.id })
    .from(khatmaPlansTable)
    .where(
      and(
        eq(khatmaPlansTable.userId, req.userId!),
        eq(khatmaPlansTable.status, "active")
      )
    )
    .limit(1);

  if (existingActive.length > 0) {
    res.status(400).json({ error: "لديك ختمة نشطة بالفعل" });
    return;
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + targetDays);

  const [plan] = await db
    .insert(khatmaPlansTable)
    .values({
      userId: req.userId!,
      name: name || "ختمة القرآن",
      targetDays,
      startDate: now,
      endDate,
      totalAyat: TOTAL_AYAT,
      currentSurahId: 1,
      currentAyah: 1,
      totalAyatRead: 0,
    })
    .returning();

  res.status(201).json(plan);
});

router.get("/khatma/active", requireAuth, async (req, res): Promise<void> => {
  const [plan] = await db
    .select()
    .from(khatmaPlansTable)
    .where(
      and(
        eq(khatmaPlansTable.userId, req.userId!),
        eq(khatmaPlansTable.status, "active")
      )
    )
    .orderBy(khatmaPlansTable.createdAt)
    .limit(1);

  if (!plan) {
    res.status(404).json({ error: "لا توجد ختمة نشطة" });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = await db
    .select()
    .from(khatmaDailyLogsTable)
    .where(
      and(
        eq(khatmaDailyLogsTable.planId, plan.id),
        eq(khatmaDailyLogsTable.date, today)
      )
    );

  const todayAyatRead = todayLogs.reduce((sum, log) => sum + log.ayatRead, 0);

  const now = new Date();
  const startDate = new Date(plan.startDate);
  const endDate = new Date(plan.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const dailyTarget = Math.ceil(plan.totalAyat / plan.targetDays);

  const expectedAyat = Math.min(daysElapsed * dailyTarget, plan.totalAyat);
  const deficit = expectedAyat - plan.totalAyatRead;

  let statusMessage = "";
  if (plan.status === "completed") {
    statusMessage = "ما شاء الله! أتممت الختمة";
  } else if (deficit > 0) {
    statusMessage = `أنت متأخر بـ ${deficit} آية`;
  } else if (deficit < 0) {
    statusMessage = `ممتاز! أنت متقدم بـ ${Math.abs(deficit)} آية`;
  } else {
    statusMessage = "أنت على المسار الصحيح";
  }

  const currentSurah = getSurahById(plan.currentSurahId);
  const currentJuz = getJuzForPosition(plan.currentSurahId, plan.currentAyah);

  res.json({
    ...plan,
    startDate: plan.startDate.toISOString(),
    endDate: plan.endDate.toISOString(),
    createdAt: plan.createdAt.toISOString(),
    completedAt: plan.completedAt?.toISOString() ?? null,
    dailyTarget,
    daysRemaining,
    progressPercent: Math.round((plan.totalAyatRead / plan.totalAyat) * 1000) / 10,
    statusMessage,
    currentSurahName: currentSurah?.nameAr ?? "",
    currentJuz,
    todayAyatRead,
    todayTarget: dailyTarget,
  });
});

router.get("/khatma/history", requireAuth, async (req, res): Promise<void> => {
  const plans = await db
    .select()
    .from(khatmaPlansTable)
    .where(
      and(
        eq(khatmaPlansTable.userId, req.userId!),
        eq(khatmaPlansTable.status, "completed")
      )
    )
    .orderBy(khatmaPlansTable.completedAt);

  res.json(plans.map((p) => ({
    ...p,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
    createdAt: p.createdAt.toISOString(),
    completedAt: p.completedAt?.toISOString() ?? null,
  })));
});

router.post("/khatma/:id/log", requireAuth, async (req, res): Promise<void> => {
  const { ayatRead, endSurahId, endAyah, note } = req.body as {
    ayatRead: number;
    endSurahId: number;
    endAyah: number;
    note?: string;
  };

  if (!ayatRead || ayatRead < 1) {
    res.status(400).json({ error: "عدد الآيات يجب أن يكون أكبر من صفر" });
    return;
  }

  const [plan] = await db
    .select()
    .from(khatmaPlansTable)
    .where(
      and(
        eq(khatmaPlansTable.id, req.params.id),
        eq(khatmaPlansTable.userId, req.userId!),
        eq(khatmaPlansTable.status, "active")
      )
    )
    .limit(1);

  if (!plan) {
    res.status(404).json({ error: "الختمة غير موجودة" });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);

  const [log] = await db
    .insert(khatmaDailyLogsTable)
    .values({
      planId: plan.id,
      date: today,
      ayatRead,
      startSurahId: plan.currentSurahId,
      startAyah: plan.currentAyah,
      endSurahId,
      endAyah,
      note: note ?? null,
    })
    .returning();

  const newTotalRead = plan.totalAyatRead + ayatRead;
  const isCompleted = newTotalRead >= TOTAL_AYAT;

  const [updatedPlan] = await db
    .update(khatmaPlansTable)
    .set({
      totalAyatRead: Math.min(newTotalRead, TOTAL_AYAT),
      currentSurahId: endSurahId,
      currentAyah: endAyah,
      status: isCompleted ? "completed" : "active",
      completedAt: isCompleted ? new Date() : null,
    })
    .where(eq(khatmaPlansTable.id, plan.id))
    .returning();

  const todayLogs = await db
    .select()
    .from(khatmaDailyLogsTable)
    .where(
      and(
        eq(khatmaDailyLogsTable.planId, plan.id),
        eq(khatmaDailyLogsTable.date, today)
      )
    );

  const todayAyatRead = todayLogs.reduce((sum, l) => sum + l.ayatRead, 0);

  const now = new Date();
  const startDate = new Date(updatedPlan.startDate);
  const endDate = new Date(updatedPlan.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const dailyTarget = Math.ceil(updatedPlan.totalAyat / updatedPlan.targetDays);

  const expectedAyat = Math.min(daysElapsed * dailyTarget, updatedPlan.totalAyat);
  const deficit = expectedAyat - updatedPlan.totalAyatRead;

  let statusMessage = "";
  if (isCompleted) {
    statusMessage = "ما شاء الله! أتممت الختمة";
  } else if (deficit > 0) {
    statusMessage = `أنت متأخر بـ ${deficit} آية`;
  } else if (deficit < 0) {
    statusMessage = `ممتاز! أنت متقدم بـ ${Math.abs(deficit)} آية`;
  } else {
    statusMessage = "أنت على المسار الصحيح";
  }

  const currentSurah = getSurahById(updatedPlan.currentSurahId);
  const currentJuz = getJuzForPosition(updatedPlan.currentSurahId, updatedPlan.currentAyah);

  res.status(201).json({
    ...updatedPlan,
    startDate: updatedPlan.startDate.toISOString(),
    endDate: updatedPlan.endDate.toISOString(),
    createdAt: updatedPlan.createdAt.toISOString(),
    completedAt: updatedPlan.completedAt?.toISOString() ?? null,
    dailyTarget,
    daysRemaining,
    progressPercent: Math.round((updatedPlan.totalAyatRead / updatedPlan.totalAyat) * 1000) / 10,
    statusMessage,
    currentSurahName: currentSurah?.nameAr ?? "",
    currentJuz,
    todayAyatRead,
    todayTarget: dailyTarget,
  });
});

router.get("/khatma/:id/daily-logs", requireAuth, async (req, res): Promise<void> => {
  const logs = await db
    .select()
    .from(khatmaDailyLogsTable)
    .where(
      and(
        eq(khatmaDailyLogsTable.planId, req.params.id),
        eq(khatmaDailyLogsTable.planId, req.params.id)
      )
    )
    .orderBy(khatmaDailyLogsTable.date);

  res.json(logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })));
});

router.post("/khatma/:id/pause", requireAuth, async (req, res): Promise<void> => {
  const [plan] = await db
    .update(khatmaPlansTable)
    .set({ status: "paused" })
    .where(
      and(
        eq(khatmaPlansTable.id, req.params.id),
        eq(khatmaPlansTable.userId, req.userId!),
        eq(khatmaPlansTable.status, "active")
      )
    )
    .returning();

  if (!plan) {
    res.status(404).json({ error: "الختمة غير موجودة" });
    return;
  }

  res.json({ ...plan, startDate: plan.startDate.toISOString(), endDate: plan.endDate.toISOString(), createdAt: plan.createdAt.toISOString(), completedAt: plan.completedAt?.toISOString() ?? null });
});

router.post("/khatma/:id/resume", requireAuth, async (req, res): Promise<void> => {
  const [plan] = await db
    .select()
    .from(khatmaPlansTable)
    .where(
      and(
        eq(khatmaPlansTable.id, req.params.id),
        eq(khatmaPlansTable.userId, req.userId!),
        eq(khatmaPlansTable.status, "paused")
      )
    )
    .limit(1);

  if (!plan) {
    res.status(404).json({ error: "الختمة غير موجودة" });
    return;
  }

  const now = new Date();
  const originalDuration = plan.targetDays * 24 * 60 * 60 * 1000;
  const newEndDate = new Date(now.getTime() + originalDuration);

  const [updated] = await db
    .update(khatmaPlansTable)
    .set({
      status: "active",
      endDate: newEndDate,
    })
    .where(eq(khatmaPlansTable.id, plan.id))
    .returning();

  res.json({ ...updated, startDate: updated.startDate.toISOString(), endDate: updated.endDate.toISOString(), createdAt: updated.createdAt.toISOString(), completedAt: updated.completedAt?.toISOString() ?? null });
});

export default router;
