import { db, duaCategoriesTable, duasTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding dua categories and duas...");

  // Categories
  const categories = [
    {
      nameAr: "أدعية المناسك",
      nameEn: "Manasik Duas",
      emoji: "🕋",
      color: "#1D9E75",
      descriptionAr: "أدعية خاصة بمناسك الحج من الإحرام حتى طواف الوداع",
      orderIndex: 1,
    },
    {
      nameAr: "أذكار الصباح والمساء",
      nameEn: "Morning & Evening Adhkar",
      emoji: "🌅",
      color: "#EF9F27",
      descriptionAr: "الأذكار المأثورة في الصباح والمساء من السنة النبوية",
      orderIndex: 2,
    },
    {
      nameAr: "أدعية الصلاة",
      nameEn: "Prayer Duas",
      emoji: "🕌",
      color: "#6366f1",
      descriptionAr: "الأدعية الواردة في أوقات الصلاة وبعدها",
      orderIndex: 3,
    },
    {
      nameAr: "أدعية جامعة",
      nameEn: "General Duas",
      emoji: "📿",
      color: "#ec4899",
      descriptionAr: "أدعية شاملة من الكتاب والسنة لكل الأحوال",
      orderIndex: 4,
    },
    {
      nameAr: "أدعية ليلة القدر",
      nameEn: "Laylat al-Qadr Duas",
      emoji: "🌙",
      color: "#8b5cf6",
      descriptionAr: "الأدعية المأثورة في ليالي العشر الأواخر من رمضان",
      orderIndex: 5,
    },
    {
      nameAr: "أدعية الطوارئ والضيق",
      nameEn: "Emergency & Distress Duas",
      emoji: "🤲",
      color: "#E24B4A",
      descriptionAr: "أدعية الفرج والتوسل في أوقات الشدة والكرب",
      orderIndex: 6,
    },
    {
      nameAr: "أدعية المكان والسفر",
      nameEn: "Travel & Place Duas",
      emoji: "🏡",
      color: "#0ea5e9",
      descriptionAr: "أدعية دخول مكة والكعبة والسفر والإقامة",
      orderIndex: 7,
    },
    {
      nameAr: "الأدعية الطويلة الكاملة",
      nameEn: "Full Long Duas",
      emoji: "🌟",
      color: "#f59e0b",
      descriptionAr: "الأدعية الطويلة الكاملة من التراث الإسلامي",
      orderIndex: 8,
    },
  ];

  const catMap: Record<string, string> = {};

  for (const cat of categories) {
    const existing = await db
      .select({ id: duaCategoriesTable.id })
      .from(duaCategoriesTable)
      .where(eq(duaCategoriesTable.nameAr, cat.nameAr))
      .limit(1);

    if (existing.length > 0) {
      catMap[cat.nameAr] = existing[0].id;
      continue;
    }

    const [inserted] = await db.insert(duaCategoriesTable).values(cat).returning({ id: duaCategoriesTable.id });
    catMap[cat.nameAr] = inserted.id;
  }

  // Duas
  const duas = [
    // ===== MANASIK =====
    {
      titleAr: "التلبية",
      titleEn: "Talbiyah",
      arabicText: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لاَ شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لاَ شَرِيكَ لَكَ",
      translationAr: "لبيت نداءك يا الله، لبيت وأنا عبدك، لا شريك لك في ربوبيتك وألوهيتك، إن الحمد كله لك والنعمة كلها منك والملك كله ملكك، لا شريك لك",
      translationEn: "Here I am, O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise and blessings are Yours, and all sovereignty. You have no partner.",
      source: "البخاري ومسلم",
      categoryName: "أدعية المناسك",
      mansakKey: "ihram",
      isFeatured: true,
      orderIndex: 1,
    },
    {
      titleAr: "دعاء رؤية الكعبة أول مرة",
      titleEn: "First Sight of the Kaaba",
      arabicText: "اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيفًا وَتَعْظِيمًا وَتَكْرِيمًا وَمَهَابَةً، وَزِدْ مَنْ شَرَّفَهُ وَكَرَّمَهُ مِمَّنْ حَجَّهُ أَوِ اعْتَمَرَهُ تَشْرِيفًا وَتَكْرِيمًا وَتَعْظِيمًا وَبِرًّا",
      translationAr: "اللهم زد هذا البيت شرفاً وعظمةً وكرامةً ومهابةً، وزد من شرّفه ممن حجّه أو اعتمره شرفاً وكرامةً وتعظيماً وبراً",
      translationEn: "O Allah, increase this House in honor, greatness, nobility, and reverence. And increase those who honor it among those who perform Hajj or Umrah in honor, nobility, greatness and righteousness.",
      source: "رواه الشافعي",
      categoryName: "أدعية المناسك",
      mansakKey: "tawaf_qudum",
      isFeatured: false,
      orderIndex: 2,
    },
    {
      titleAr: "دعاء بين الركن اليماني والحجر الأسود",
      titleEn: "Dua Between Yemeni Corner and Black Stone",
      arabicText: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      translationAr: "ربنا أعطنا في الدنيا خيراً وفي الآخرة خيراً، وقنا عذاب النار",
      translationEn: "Our Lord, grant us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
      source: "أبو داود والبيهقي — الآية: البقرة ٢٠١",
      categoryName: "أدعية المناسك",
      mansakKey: "tawaf_qudum",
      isFeatured: false,
      orderIndex: 3,
    },
    {
      titleAr: "دعاء الصفا",
      titleEn: "Dua at Safa",
      arabicText: "اللهُ أَكْبَرُ، اللهُ أَكْبَرُ، اللهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، أَنْجَزَ وَعْدَهُ، وَنَصَرَ عَبْدَهُ، وَهَزَمَ الأَحْزَابَ وَحْدَهُ",
      translationAr: "الله أكبر، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، يحيي ويميت، وهو على كل شيء قدير. وفى وعده، ونصر عبده، وهزم الأحزاب وحده",
      translationEn: "Allah is the Greatest. There is no god but Allah alone, without partner. To Him belongs dominion and all praise. He gives life and causes death. He is Powerful over all things. He fulfilled His promise, gave victory to His servant, and alone defeated the confederates.",
      source: "مسلم",
      categoryName: "أدعية المناسك",
      mansakKey: "sai",
      isFeatured: false,
      orderIndex: 4,
    },
    {
      titleAr: "أفضل دعاء يوم عرفة",
      titleEn: "Best Dua on Day of Arafah",
      arabicText: "لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
      translationAr: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير",
      translationEn: "There is no god but Allah alone, without partner. To Him belongs all dominion and all praise, and He is capable of all things.",
      source: "رواه الترمذي — قال النبي ﷺ: خير الدعاء دعاء يوم عرفة",
      categoryName: "أدعية المناسك",
      mansakKey: "wuquf_arafah",
      isFeatured: true,
      orderIndex: 5,
    },
    {
      titleAr: "دعاء عرفات الطويل",
      titleEn: "Full Dua of Arafah",
      arabicText: "اللَّهُمَّ لَكَ الْحَمْدُ كَالَّذِي نَقُولُ وَخَيْرًا مِمَّا نَقُولُ، اللَّهُمَّ لَكَ صَلاَتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي، وَإِلَيْكَ مَآبِي، وَلَكَ تُرَاثِي، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، وَوَسْوَسَةِ الصَّدْرِ، وَشَتَاتِ الأَمْرِ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ مَا تَجِيءُ بِهِ الرِّيحُ",
      translationAr: "اللهم لك الحمد كما نقول وأحسن مما نقول. اللهم لك صلاتي ونسكي وحياتي ومماتي وإليك مرجعي. اللهم إني أعوذ بك من عذاب القبر ووسوسة الصدر وتشتت الأمر. اللهم أعوذ بك من شر ما تحمله الرياح",
      translationEn: "O Allah, to You belongs all praise as we say and better than what we say. O Allah, my prayer, my worship, my life and my death are for You, and to You is my return. O Allah, I seek refuge in You from the punishment of the grave, the whispers of the chest, and the scattering of affairs.",
      source: "ابن السني",
      categoryName: "أدعية المناسك",
      mansakKey: "wuquf_arafah",
      isFeatured: false,
      duaType: "long",
      orderIndex: 6,
    },
    {
      titleAr: "دعاء رمي الجمرات",
      titleEn: "Dua when throwing Jamarat",
      arabicText: "بِسْمِ اللَّهِ، اللَّهُ أَكْبَرُ، رَغْماً لِلشَّيْطَانِ وَحِزْبِهِ، اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا وَسَعْياً مَشْكُورًا وَذَنْباً مَغْفُورًا",
      translationAr: "بسم الله، الله أكبر، إهانةً للشيطان وجنوده. اللهم اجعله حجاً مبروراً وسعياً مشكوراً وذنباً مغفوراً",
      translationEn: "In the name of Allah, Allah is the Greatest, in humiliation of Satan and his party. O Allah, make it an accepted Hajj, a thanked effort, and a forgiven sin.",
      source: "ابن ماجه",
      categoryName: "أدعية المناسك",
      mansakKey: "rami_aqaba",
      isFeatured: false,
      orderIndex: 7,
    },
    {
      titleAr: "دعاء طواف الوداع",
      titleEn: "Farewell Tawaf Dua",
      arabicText: "اللَّهُمَّ الْبَيْتُ بَيْتُكَ، وَالْعَبْدُ عَبْدُكَ، وَابْنُ عَبْدِكَ، وَابْنُ أَمَتِكَ، حَمَلْتَنِي عَلَى مَا سَخَّرْتَ لِي مِنْ خَلْقِكَ، وَسَيَّرْتَنِي فِي بِلاَدِكَ، حَتَّى بَلَّغْتَنِي بِنِعْمَتِكَ إِلَى بَيْتِكَ، وَأَعَنْتَنِي عَلَى أَدَاءِ نُسُكِي، فَإِنْ كُنْتَ رَضِيتَ عَنِّي فَازْدَدْ عَنِّي رِضًا، وَإِلاَّ فَمِنَ الآنَ فَارْضَ عَنِّي قَبْلَ أَنْ تَنْأَى عَنْ بَيْتِكَ دَارِي",
      translationAr: "اللهم البيت بيتك والعبد عبدك وابن عبدك وابن أمتك. حملتني على ما سخّرت لي من خلقك وسيّرتني في بلادك حتى أوصلتني بنعمتك إلى بيتك وأعنتني على أداء نسكي. فإن كنت رضيت عني فزدني رضاً، وإلا فمن الآن فارضَ عني قبل أن تبعد عن بيتك داري",
      translationEn: "O Allah, the House is Your House, and the servant is Your servant, son of Your servant, son of Your maidservant. You carried me upon what You subjugated for me of Your creation, and made me travel through Your lands until You brought me with Your blessing to Your House, and You helped me perform my rituals.",
      source: "الأذكار للنووي",
      categoryName: "أدعية المناسك",
      mansakKey: "tawaf_wada",
      isFeatured: false,
      orderIndex: 8,
    },

    // ===== MORNING & EVENING =====
    {
      titleAr: "أصبحنا وأصبح الملك لله",
      titleEn: "Morning Remembrance",
      arabicText: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ",
      translationAr: "أصبحنا وأصبح الملك لله والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير. ربي أسألك خير ما في هذا اليوم وخير ما بعده، وأعوذ بك من شر ما في هذا اليوم وشر ما بعده",
      translationEn: "We have reached the morning and at this very time all sovereignty belongs to Allah. Praise be to Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise, and He is over all things omnipotent. My Lord, I ask You for the good of this day and the good of what follows it.",
      source: "مسلم",
      categoryName: "أذكار الصباح والمساء",
      isFeatured: false,
      orderIndex: 1,
    },
    {
      titleAr: "يا حي يا قيوم",
      titleEn: "Ya Hayyu Ya Qayyum",
      arabicText: "يَا حَيُّ يَا قَيُّومُ، بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
      translationAr: "يا من لا يزول وجوده، يا من قائم على كل شيء، بكرمك ورحمتك أستعين، أصلح لي كل أموري ولا تتركني لنفسي لحظة واحدة",
      translationEn: "O Ever Living, O Self-Sustaining and Supporter of all, by Your mercy I seek assistance. Rectify for me all of my affairs and do not leave me to myself, even for the blink of an eye.",
      source: "الحاكم — صحيح",
      categoryName: "أذكار الصباح والمساء",
      isFeatured: true,
      orderIndex: 2,
    },
    {
      titleAr: "أعوذ بكلمات الله التامات",
      titleEn: "Refuge with Allah's Perfect Words",
      arabicText: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
      translationAr: "أتحصن بكلمات الله الكاملة من شر كل ما خلق الله",
      translationEn: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
      source: "مسلم — ثلاث مرات في المساء",
      categoryName: "أذكار الصباح والمساء",
      isFeatured: false,
      orderIndex: 3,
    },
    {
      titleAr: "بسم الله الذي لا يضر",
      titleEn: "In Allah's Name who causes no harm",
      arabicText: "بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
      translationAr: "بسم الله الذي بذكر اسمه لا يؤذي شيء في الأرض ولا في السماء، وهو السميع العليم",
      translationEn: "In the name of Allah with Whose name nothing can cause harm in the earth or the heavens, and He is the All-Hearing, All-Knowing.",
      source: "أبو داود والترمذي — ثلاث مرات صباحاً ومساءً",
      categoryName: "أذكار الصباح والمساء",
      isFeatured: false,
      orderIndex: 4,
    },
    {
      titleAr: "سيد الاستغفار",
      titleEn: "Master of Seeking Forgiveness",
      arabicText: "اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ",
      translationAr: "اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت. أعوذ بك من شر ما صنعت، وأعترف لك بنعمتك عليّ، وأعترف بذنبي، فاغفر لي، فإنه لا يغفر الذنوب إلا أنت",
      translationEn: "O Allah, You are my Lord, there is no god but You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your blessings upon me, and I acknowledge my sins, so forgive me, for none forgives sins except You.",
      source: "البخاري — من قالها صباحاً موقناً ومات في يومه دخل الجنة",
      categoryName: "أذكار الصباح والمساء",
      isFeatured: true,
      orderIndex: 5,
    },
    {
      titleAr: "رضيت بالله رباً",
      titleEn: "Contentment with Allah",
      arabicText: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالإِسْلامِ دِينًا، وَبِمُحَمَّدٍ صلى الله عليه وسلم نَبِيًّا",
      translationAr: "رضيت بالله رباً ومعبوداً، وبالإسلام ديناً ومنهجاً، وبمحمد ﷺ نبياً ورسولاً",
      translationEn: "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace be upon him) as my Prophet.",
      source: "أبو داود — ثلاث مرات في الصباح والمساء",
      categoryName: "أذكار الصباح والمساء",
      isFeatured: false,
      orderIndex: 6,
    },

    // ===== PRAYER DUAS =====
    {
      titleAr: "دعاء الاستفتاح",
      titleEn: "Opening Supplication",
      arabicText: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلاَ إِلَهَ غَيْرُكَ",
      translationAr: "سبحانك اللهم وبحمدك، تبارك اسمك وتعالت عظمتك، ولا إله غيرك",
      translationEn: "Glory and praise be to You, O Allah. Blessed be Your name, exalted be Your majesty, and there is no god but You.",
      source: "أبو داود والترمذي",
      categoryName: "أدعية الصلاة",
      isFeatured: false,
      orderIndex: 1,
    },
    {
      titleAr: "دعاء الركوع",
      titleEn: "Dua in Ruku",
      arabicText: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
      translationAr: "سبحان ربي العظيم",
      translationEn: "Glory be to my Lord, the Magnificent.",
      source: "أبو داود — ثلاث مرات في الركوع",
      categoryName: "أدعية الصلاة",
      isFeatured: false,
      orderIndex: 2,
    },
    {
      titleAr: "دعاء السجود",
      titleEn: "Dua in Sujud",
      arabicText: "سُبْحَانَ رَبِّيَ الأَعْلَى",
      translationAr: "سبحان ربي الأعلى",
      translationEn: "Glory be to my Lord, the Most High.",
      source: "أبو داود — ثلاث مرات في السجود",
      categoryName: "أدعية الصلاة",
      isFeatured: false,
      orderIndex: 3,
    },
    {
      titleAr: "التشهد",
      titleEn: "Tashahhud",
      arabicText: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلاَمُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلاَمُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
      translationAr: "التحيات والعبادات والطيبات لله، السلام عليك أيها النبي ورحمة الله وبركاته، السلام علينا وعلى عباد الله الصالحين. أشهد أن لا إله إلا الله وأشهد أن محمداً عبده ورسوله",
      translationEn: "All greetings of humility are for Allah, and all prayers and goodness. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous slaves of Allah. I bear witness that none has the right to be worshipped except Allah, and I bear witness that Muhammad is His slave and Messenger.",
      source: "البخاري ومسلم",
      categoryName: "أدعية الصلاة",
      isFeatured: false,
      orderIndex: 4,
    },
    {
      titleAr: "الصلاة على النبي ﷺ (الصلاة الإبراهيمية)",
      titleEn: "Salah upon the Prophet (Ibrahimiyyah)",
      arabicText: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ",
      translationAr: "اللهم صلّ على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم، إنك حميد مجيد. اللهم بارك على محمد وعلى آل محمد كما باركت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد",
      translationEn: "O Allah, send prayers upon Muhammad and the family of Muhammad, as You sent prayers upon Ibrahim and the family of Ibrahim; You are indeed Worthy of Praise, Full of Glory.",
      source: "البخاري ومسلم — بعد التشهد",
      categoryName: "أدعية الصلاة",
      isFeatured: false,
      orderIndex: 5,
    },

    // ===== GENERAL DUAS =====
    {
      titleAr: "دعاء كرب (دعاء الشدة)",
      titleEn: "Dua of Distress",
      arabicText: "لاَ إِلَهَ إِلاَّ اللَّهُ الْعَظِيمُ الْحَلِيمُ، لاَ إِلَهَ إِلاَّ اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لاَ إِلَهَ إِلاَّ اللَّهُ رَبُّ السَّمَوَاتِ وَرَبُّ الأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ",
      translationAr: "لا إله إلا الله العظيم الحليم، لا إله إلا الله رب العرش العظيم، لا إله إلا الله رب السماوات ورب الأرض ورب العرش الكريم",
      translationEn: "There is no god but Allah, the Mighty, the Forbearing. There is no god but Allah, Lord of the Mighty Throne. There is no god but Allah, Lord of the heavens, Lord of the earth, and Lord of the Noble Throne.",
      source: "البخاري ومسلم",
      categoryName: "أدعية جامعة",
      isFeatured: true,
      orderIndex: 1,
    },
    {
      titleAr: "دعاء يونس عليه السلام",
      titleEn: "Dua of Yunus (AS)",
      arabicText: "لاَ إِلَهَ إِلاَّ أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
      translationAr: "لا إله غيرك، سبحانك وتنزيهاً لك، إني كنت ظالماً لنفسي",
      translationEn: "There is no god but You. Glory be to You. Verily, I was among the wrongdoers.",
      source: "القرآن الكريم — الأنبياء: ٨٧ — ما دعا بها مكروب إلا فرّج الله عنه",
      categoryName: "أدعية جامعة",
      isFeatured: true,
      orderIndex: 2,
    },
    {
      titleAr: "دعاء ربنا آتنا في الدنيا",
      titleEn: "Dua for Good in Both Worlds",
      arabicText: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      translationAr: "ربنا أعطنا خيراً في هذه الدنيا وخيراً في الآخرة، وأنقذنا من عذاب النار",
      translationEn: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
      source: "القرآن الكريم — البقرة: ٢٠١",
      categoryName: "أدعية جامعة",
      isFeatured: false,
      orderIndex: 3,
    },
    {
      titleAr: "دعاء ربنا ظلمنا أنفسنا",
      titleEn: "Dua of Adam and Eve",
      arabicText: "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
      translationAr: "ربنا ظلمنا أنفسنا، وإن لم تغفر لنا وترحمنا لنكونن من الخاسرين",
      translationEn: "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.",
      source: "القرآن الكريم — الأعراف: ٢٣",
      categoryName: "أدعية جامعة",
      isFeatured: false,
      orderIndex: 4,
    },

    // ===== LAYLAT AL-QADR =====
    {
      titleAr: "دعاء ليلة القدر",
      titleEn: "Dua of Laylat al-Qadr",
      arabicText: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
      translationAr: "اللهم إنك عفو تحب العفو فاعف عني",
      translationEn: "O Allah, You are Pardoning and You love to pardon, so pardon me.",
      source: "الترمذي وابن ماجه — علّمه النبي ﷺ لعائشة رضي الله عنها",
      categoryName: "أدعية ليلة القدر",
      isFeatured: true,
      orderIndex: 1,
    },

    // ===== EMERGENCY & DISTRESS =====
    {
      titleAr: "دعاء الهم والغم",
      titleEn: "Dua for Anxiety and Sorrow",
      arabicText: "اللَّهُمَّ إِنِّي عَبْدُكَ، ابْنُ عَبْدِكَ، ابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ، أَسْأَلُكَ بِكُلِّ اسْمٍ هُوَ لَكَ سَمَّيْتَ بِهِ نَفْسَكَ، أَوْ أَنْزَلْتَهُ فِي كِتَابِكَ، أَوْ عَلَّمْتَهُ أَحَدًا مِنْ خَلْقِكَ، أَوِ اسْتَأْثَرْتَ بِهِ فِي عِلْمِ الْغَيْبِ عِنْدَكَ، أَنْ تَجْعَلَ الْقُرْآنَ رَبِيعَ قَلْبِي، وَنُورَ صَدْرِي، وَجَلاَءَ حُزْنِي، وَذَهَابَ هَمِّي",
      translationAr: "اللهم إني عبدك وابن عبدك وابن أمتك، ناصيتي بيدك، ماضٍ فيّ حكمك، عدل فيّ قضاؤك. أسألك بكل اسم هو لك، أن تجعل القرآن ربيع قلبي ونور صدري وجلاء حزني وذهاب همي",
      translationEn: "O Allah, I am Your servant, son of Your servant, son of Your maidservant. My forelock is in Your hand. Your command over me is forever executed. Your decree over me is just. I ask You by every name belonging to You, to make the Quran the spring of my heart and the light of my chest, and a departure for my sorrow and a release for my anxiety.",
      source: "أحمد — إلا أبدل الله حزنه فرجاً",
      categoryName: "أدعية الطوارئ والضيق",
      isFeatured: true,
      orderIndex: 1,
    },
    {
      titleAr: "دعاء المريض",
      titleEn: "Dua for the Sick",
      arabicText: "أَسْأَلُ اللَّهَ الْعَظِيمَ، رَبَّ الْعَرْشِ الْعَظِيمِ، أَنْ يَشْفِيَكَ",
      translationAr: "أسأل الله العظيم رب العرش العظيم أن يشفيك",
      translationEn: "I ask Allah, the Mighty, the Lord of the Mighty Throne, to cure you.",
      source: "أبو داود والترمذي — سبع مرات عند المريض",
      categoryName: "أدعية الطوارئ والضيق",
      isFeatured: false,
      orderIndex: 2,
    },
    {
      titleAr: "دعاء الضياع (للتائه في الحج)",
      titleEn: "Dua for the Lost Pilgrim",
      arabicText: "يَا وَلِيَّ الضَّالِّينَ، رُدَّنِي إِلَى رُفْقَتِي، اللَّهُمَّ دُلَّنِي عَلَى طَرِيقِي",
      translationAr: "يا ولي الضائعين، أرجعني إلى رفقتي. اللهم اهدني إلى طريقي",
      translationEn: "O Protector of the lost, return me to my companions. O Allah, guide me to my path.",
      source: "أدعية مأثورة في السفر",
      categoryName: "أدعية الطوارئ والضيق",
      isFeatured: false,
      orderIndex: 3,
    },
    {
      titleAr: "دعاء قضاء الدين",
      titleEn: "Dua for Debt Relief",
      arabicText: "اللَّهُمَّ اكْفِنِي بِحَلاَلِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ",
      translationAr: "اللهم اكفني بحلالك عن حرامك، وأغنني بفضلك عمن سواك",
      translationEn: "O Allah, suffice me with what is lawful against what is prohibited, and make me independent of all those besides You.",
      source: "الترمذي",
      categoryName: "أدعية الطوارئ والضيق",
      isFeatured: false,
      orderIndex: 4,
    },

    // ===== TRAVEL & PLACE =====
    {
      titleAr: "دعاء السفر",
      titleEn: "Travel Dua",
      arabicText: "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ، اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى، اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ، اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ، وَالْخَلِيفَةُ فِي الأَهْلِ",
      translationAr: "الله أكبر ثلاثاً. سبحان من سخّر لنا هذا وما كنا له مطيقين، وإنا إلى ربنا لراجعون. اللهم إنا نسألك في سفرنا هذا البر والتقوى ومن العمل ما ترضى. اللهم هوّن علينا سفرنا هذا واطوِ عنا بعده. اللهم أنت الرفيق في السفر والخليفة في الأهل",
      translationEn: "Allah is Greatest (3 times). Glory be to Him Who has subjected this to us, and we were not capable of it. And verily to our Lord we shall return. O Allah, we ask You for righteousness and piety in this journey. O Allah, make easy for us this journey, and fold up for us its distance. O Allah, You are the Companion in travel and the Guardian of the family.",
      source: "مسلم",
      categoryName: "أدعية المكان والسفر",
      mansakKey: null,
      isFeatured: true,
      orderIndex: 1,
    },
    {
      titleAr: "دعاء دخول مكة المكرمة",
      titleEn: "Dua Entering Mecca",
      arabicText: "اللَّهُمَّ هَذَا حَرَمُكَ وَأَمْنُكَ، فَحَرِّمْنِي عَلَى النَّارِ، وَأَمِّنِّي مِنْ عَذَابِكَ يَوْمَ تَبْعَثُ عِبَادَكَ، وَاجْعَلْنِي مِنْ أَوْلِيَائِكَ وَأَهْلِ طَاعَتِكَ",
      translationAr: "اللهم هذا حرمك وأمانك، فحرّمني على النار، وأمّنني من عذابك يوم تبعث عبادك، واجعلني من أوليائك وأهل طاعتك",
      translationEn: "O Allah, this is Your sanctuary and Your security. So make me forbidden from the Fire, secure me from Your punishment on the Day You resurrect Your servants, and make me among Your allies and those who obey You.",
      source: "البيهقي",
      categoryName: "أدعية المكان والسفر",
      isFeatured: false,
      orderIndex: 2,
    },
    {
      titleAr: "دعاء دخول المنزل والفندق",
      titleEn: "Dua Entering Home/Hotel",
      arabicText: "بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
      translationAr: "بسم الله دخلنا، وبسم الله خرجنا، وعلى الله ربنا توكلنا",
      translationEn: "In the name of Allah we enter, in the name of Allah we leave, and upon our Lord Allah we rely.",
      source: "أبو داود",
      categoryName: "أدعية المكان والسفر",
      isFeatured: false,
      orderIndex: 3,
    },

    // ===== LONG DUAS =====
    {
      titleAr: "دعاء عرفات الكامل",
      titleEn: "Complete Arafah Supplication",
      arabicText: "لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.\n\nاللَّهُمَّ اجْعَلْ فِي قَلْبِي نُورًا، وَفِي سَمْعِي نُورًا، وَفِي بَصَرِي نُورًا، اللَّهُمَّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي.\n\nاللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى.\n\nاللَّهُمَّ إِنِّي أَسْأَلُكَ مِنَ الْخَيْرِ كُلِّهِ، عَاجِلِهِ وَآجِلِهِ، مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ، وَأَعُوذُ بِكَ مِنَ الشَّرِّ كُلِّهِ، عَاجِلِهِ وَآجِلِهِ، مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ.\n\nاللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ خَيْرِ مَا سَأَلَكَ عَبْدُكَ وَنَبِيُّكَ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا عَاذَ مِنْهُ عَبْدُكَ وَنَبِيُّكَ.\n\nاللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ، وَأَعُوذُ بِكَ مِنَ النَّارِ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ.\n\nرَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      translationAr: "دعاء جامع يُقال في وقفة عرفة — يجمع سؤال الخير كله والنجاة من الشر كله",
      translationEn: "A comprehensive supplication recited during the Arafah standing — combining request for all goodness and protection from all evil.",
      source: "جمع من أدعية النبي ﷺ في الصحيحين",
      categoryName: "الأدعية الطويلة الكاملة",
      mansakKey: "wuquf_arafah",
      duaType: "full_sequence",
      isFeatured: true,
      orderIndex: 1,
    },
    {
      titleAr: "دعاء التوبة الكامل",
      titleEn: "Complete Repentance Supplication",
      arabicText: "اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ.\n\nأَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ.\n\nاللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا، وَلاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ، وَارْحَمْنِي، إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ.\n\nاللَّهُمَّ تُبْ عَلَيَّ وَاهْدِنِي وَارْزُقْنِي وَعَافِنِي، وَاعْفُ عَنِّي.\n\nرَبَّنَا اغْفِرْ لَنَا وَلإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالإِيمَانِ",
      translationAr: "دعاء التوبة الشامل — يجمع الاعتراف بالذنب وطلب المغفرة والهداية",
      translationEn: "Comprehensive repentance supplication — combining acknowledgment of sin and seeking forgiveness and guidance.",
      source: "جمع من الصحيحين والقرآن الكريم",
      categoryName: "الأدعية الطويلة الكاملة",
      duaType: "full_sequence",
      isFeatured: false,
      orderIndex: 2,
    },
  ];

  let inserted = 0;
  for (const dua of duas) {
    const catId = catMap[dua.categoryName];
    if (!catId) {
      console.warn(`Category not found: ${dua.categoryName}`);
      continue;
    }

    const existing = await db
      .select({ id: duasTable.id })
      .from(duasTable)
      .where(eq(duasTable.titleAr, dua.titleAr))
      .limit(1);

    if (existing.length > 0) continue;

    await db.insert(duasTable).values({
      titleAr: dua.titleAr,
      titleEn: dua.titleEn ?? null,
      arabicText: dua.arabicText,
      translationAr: dua.translationAr ?? null,
      translationEn: dua.translationEn ?? null,
      source: dua.source ?? null,
      categoryId: catId,
      mansakKey: dua.mansakKey ?? null,
      isFeatured: dua.isFeatured ?? false,
      duaType: (dua as { duaType?: string }).duaType ?? "short",
      orderIndex: dua.orderIndex ?? 0,
    });

    // Update category count
    await db
      .update(duaCategoriesTable)
      .set({ duasCount: (await db.select({ c: duaCategoriesTable.duasCount }).from(duaCategoriesTable).where(eq(duaCategoriesTable.id, catId)).limit(1))[0]?.c + 1 || 1 })
      .where(eq(duaCategoriesTable.id, catId));

    inserted++;
  }

  console.log(`Seeded ${inserted} duas across ${categories.length} categories.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
