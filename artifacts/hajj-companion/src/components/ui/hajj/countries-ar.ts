/** ISO 3166-1 alpha-2 with Arabic name + flag emoji (pinned first in UI). */
export type CountryOption = { code: string; nameAr: string; flag: string };

export const PINNED_COUNTRY_CODES = [
  "TN",
  "DZ",
  "MA",
  "LY",
  "SA",
  "EG",
  "IN",
  "PK",
  "ID",
  "TR",
] as const;

const ALL: CountryOption[] = [
  { code: "AF", nameAr: "أفغانستان", flag: "🇦🇫" },
  { code: "AL", nameAr: "ألبانيا", flag: "🇦🇱" },
  { code: "DZ", nameAr: "الجزائر", flag: "🇩🇿" },
  { code: "AR", nameAr: "الأرجنتين", flag: "🇦🇷" },
  { code: "AU", nameAr: "أستراليا", flag: "🇦🇺" },
  { code: "AT", nameAr: "النمسا", flag: "🇦🇹" },
  { code: "AZ", nameAr: "أذربيجان", flag: "🇦🇿" },
  { code: "BH", nameAr: "البحرين", flag: "🇧🇭" },
  { code: "BD", nameAr: "بنغلاديش", flag: "🇧🇩" },
  { code: "BE", nameAr: "بلجيكا", flag: "🇧🇪" },
  { code: "BA", nameAr: "البوسنة والهرسك", flag: "🇧🇦" },
  { code: "BR", nameAr: "البرازيل", flag: "🇧🇷" },
  { code: "BG", nameAr: "بلغاريا", flag: "🇧🇬" },
  { code: "CM", nameAr: "الكاميرون", flag: "🇨🇲" },
  { code: "CA", nameAr: "كندا", flag: "🇨🇦" },
  { code: "CN", nameAr: "الصين", flag: "🇨🇳" },
  { code: "HR", nameAr: "كرواتيا", flag: "🇭🇷" },
  { code: "CY", nameAr: "قبرص", flag: "🇨🇾" },
  { code: "CZ", nameAr: "التشيك", flag: "🇨🇿" },
  { code: "DK", nameAr: "الدنمارك", flag: "🇩🇰" },
  { code: "EG", nameAr: "مصر", flag: "🇪🇬" },
  { code: "ET", nameAr: "إثيوبيا", flag: "🇪🇹" },
  { code: "FI", nameAr: "فنلندا", flag: "🇫🇮" },
  { code: "FR", nameAr: "فرنسا", flag: "🇫🇷" },
  { code: "DE", nameAr: "ألمانيا", flag: "🇩🇪" },
  { code: "GH", nameAr: "غانا", flag: "🇬🇭" },
  { code: "GR", nameAr: "اليونان", flag: "🇬🇷" },
  { code: "HU", nameAr: "المجر", flag: "🇭🇺" },
  { code: "IS", nameAr: "آيسلندا", flag: "🇮🇸" },
  { code: "IN", nameAr: "الهند", flag: "🇮🇳" },
  { code: "ID", nameAr: "إندونيسيا", flag: "🇮🇩" },
  { code: "IR", nameAr: "إيران", flag: "🇮🇷" },
  { code: "IQ", nameAr: "العراق", flag: "🇮🇶" },
  { code: "IE", nameAr: "أيرلندا", flag: "🇮🇪" },
  { code: "IT", nameAr: "إيطاليا", flag: "🇮🇹" },
  { code: "CI", nameAr: "ساحل العاج", flag: "🇨🇮" },
  { code: "JO", nameAr: "الأردن", flag: "🇯🇴" },
  { code: "KZ", nameAr: "كازاخستان", flag: "🇰🇿" },
  { code: "KE", nameAr: "كينيا", flag: "🇰🇪" },
  { code: "KW", nameAr: "الكويت", flag: "🇰🇼" },
  { code: "LB", nameAr: "لبنان", flag: "🇱🇧" },
  { code: "LY", nameAr: "ليبيا", flag: "🇱🇾" },
  { code: "MY", nameAr: "ماليزيا", flag: "🇲🇾" },
  { code: "MV", nameAr: "المالديف", flag: "🇲🇻" },
  { code: "ML", nameAr: "مالي", flag: "🇲🇱" },
  { code: "MR", nameAr: "موريتانيا", flag: "🇲🇷" },
  { code: "MA", nameAr: "المغرب", flag: "🇲🇦" },
  { code: "NL", nameAr: "هولندا", flag: "🇳🇱" },
  { code: "NE", nameAr: "النيجر", flag: "🇳🇪" },
  { code: "NG", nameAr: "نيجيريا", flag: "🇳🇬" },
  { code: "NO", nameAr: "النرويج", flag: "🇳🇴" },
  { code: "OM", nameAr: "عُمان", flag: "🇴🇲" },
  { code: "PK", nameAr: "باكستان", flag: "🇵🇰" },
  { code: "PS", nameAr: "فلسطين", flag: "🇵🇸" },
  { code: "PH", nameAr: "الفلبين", flag: "🇵🇭" },
  { code: "PL", nameAr: "بولندا", flag: "🇵🇱" },
  { code: "PT", nameAr: "البرتغال", flag: "🇵🇹" },
  { code: "QA", nameAr: "قطر", flag: "🇶🇦" },
  { code: "RO", nameAr: "رومانيا", flag: "🇷🇴" },
  { code: "RU", nameAr: "روسيا", flag: "🇷🇺" },
  { code: "RW", nameAr: "رواندا", flag: "🇷🇼" },
  { code: "SA", nameAr: "السعودية", flag: "🇸🇦" },
  { code: "SN", nameAr: "السنغال", flag: "🇸🇳" },
  { code: "RS", nameAr: "صربيا", flag: "🇷🇸" },
  { code: "SO", nameAr: "الصومال", flag: "🇸🇴" },
  { code: "ZA", nameAr: "جنوب أفريقيا", flag: "🇿🇦" },
  { code: "ES", nameAr: "إسبانيا", flag: "🇪🇸" },
  { code: "SD", nameAr: "السودان", flag: "🇸🇩" },
  { code: "SE", nameAr: "السويد", flag: "🇸🇪" },
  { code: "CH", nameAr: "سويسرا", flag: "🇨🇭" },
  { code: "SY", nameAr: "سوريا", flag: "🇸🇾" },
  { code: "TJ", nameAr: "طاجيكستان", flag: "🇹🇯" },
  { code: "TZ", nameAr: "تنزانيا", flag: "🇹🇿" },
  { code: "TH", nameAr: "تايلاند", flag: "🇹🇭" },
  { code: "TN", nameAr: "تونس", flag: "🇹🇳" },
  { code: "TR", nameAr: "تركيا", flag: "🇹🇷" },
  { code: "TM", nameAr: "تركمانستان", flag: "🇹🇲" },
  { code: "UG", nameAr: "أوغندا", flag: "🇺🇬" },
  { code: "UA", nameAr: "أوكرانيا", flag: "🇺🇦" },
  { code: "AE", nameAr: "الإمارات", flag: "🇦🇪" },
  { code: "GB", nameAr: "المملكة المتحدة", flag: "🇬🇧" },
  { code: "US", nameAr: "الولايات المتحدة", flag: "🇺🇸" },
  { code: "UZ", nameAr: "أوزبكستان", flag: "🇺🇿" },
  { code: "YE", nameAr: "اليمن", flag: "🇾🇪" },
];

const byCode = new Map(ALL.map((c) => [c.code, c]));

export function getCountryByCode(code: string): CountryOption | undefined {
  return byCode.get(code.toUpperCase());
}

export function buildNationalityList(): { pinned: CountryOption[]; rest: CountryOption[] } {
  const pinned: CountryOption[] = [];
  for (const code of PINNED_COUNTRY_CODES) {
    const c = byCode.get(code);
    if (c) pinned.push(c);
  }
  const pinnedSet = new Set(PINNED_COUNTRY_CODES as readonly string[]);
  const rest = ALL.filter((c) => !pinnedSet.has(c.code)).sort((a, b) =>
    a.nameAr.localeCompare(b.nameAr, "ar"),
  );
  return { pinned, rest };
}
