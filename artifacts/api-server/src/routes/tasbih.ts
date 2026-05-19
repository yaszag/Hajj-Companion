import { Router } from "express";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { db, tasbihPresetsTable, userTasbihSessionsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

const TODAY = () => new Date().toISOString().slice(0, 10);

const PRESETS = [
  // ═══ MORNING (فجر / صباح) ═══
  { phraseAr: "سبحان الله", transliteration: "SubhanAllah", translationAr: "تنزيه الله", meaning: "Glory be to Allah", recommendedCount: 33, category: "تسبيح", timeOfDay: "morning", spiritualNote: "من أحب الكلام إلى الله", orderIndex: 1, isFeatured: true },
  { phraseAr: "الحمد لله", transliteration: "Alhamdulillah", translationAr: "شكر الله", meaning: "Praise be to Allah", recommendedCount: 33, category: "تسبيح", timeOfDay: "morning", spiritualNote: "تملأ الميزان", orderIndex: 2, isFeatured: true },
  { phraseAr: "الله أكبر", transliteration: "Allahu Akbar", translationAr: "تعظيم الله", meaning: "Allah is the Greatest", recommendedCount: 34, category: "تسبيح", timeOfDay: "morning", spiritualNote: "كلمة عظيمة عند الله", orderIndex: 3, isFeatured: true },
  { phraseAr: "سبحان الله وبحمده", transliteration: "SubhanAllahi wa bihamdihi", translationAr: "التسبيح مع الحمد", meaning: "Glory be to Allah and His praise", recommendedCount: 100, category: "تسبيح", timeOfDay: "morning", spiritualNote: "من قالها مائة مرة حين يصبح وحين يمسي لم يأت أحد بأفضل مما جاء به", orderIndex: 4, isFeatured: true },
  { phraseAr: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير", transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa ala kulli shay'in qadir", translationAr: "كلمة التوحيد", meaning: "There is no god but Allah alone, to Him belongs sovereignty and praise", recommendedCount: 10, category: "تهليل", timeOfDay: "morning", spiritualNote: "من قالها عشر مرات كان كمن أعتق أربعة أنفس من ولد إسماعيل", orderIndex: 5, isFeatured: true },
  { phraseAr: "اللهم إني أصبحت أشهدك وأشهد حملة عرشك وملائكتك وجميع خلقك أنك أنت الله لا إله إلا أنت وحدك لا شريك لك وأن محمداً عبدك ورسولك", transliteration: "Allahumma inni asbahtu ush-hiduka wa ush-hidu hamalata arshika wa mala'ikataka wa jami'a khalqika annaka antallahu la ilaha illa anta wahdaka la sharika laka wa anna Muhammadan abduka wa rasuluk", translationAr: "دعاء الصباح", meaning: "O Allah, I have reached the morning and call You to witness that You are Allah", recommendedCount: 4, category: "دعاء الصباح", timeOfDay: "morning", spiritualNote: "من قالها أربع مرات حين يصبح أعتقه الله من النار", orderIndex: 6, isFeatured: false },
  { phraseAr: "اللهم ما أصبح بي من نعمة أو بأحد من خلقك فمنك وحدك لا شريك لك، فلك الحمد ولك الشكر", transliteration: "Allahumma ma asbaha bi min ni'matin aw bi ahadin min khalqika faminka wahdaka la sharika lak, falakal-hamdu wa lakash-shukr", translationAr: "شكر النعمة", meaning: "O Allah, whatever blessing I or any of Your creatures have reached the morning with is from You alone", recommendedCount: 1, category: "دعاء الصباح", timeOfDay: "morning", spiritualNote: "من قالها حين يصبح فقد أدى شكر يومه", orderIndex: 7, isFeatured: false },
  { phraseAr: "اللهم عافني في بدني، اللهم عافني في سمعي، اللهم عافني في بصري، لا إله إلا أنت", transliteration: "Allahumma afini fi badani, Allahumma afini fi sam'i, Allahumma afini fi basari, la ilaha illa ant", translationAr: "دعاء العافية", meaning: "O Allah, grant me health in my body, hearing, and sight", recommendedCount: 3, category: "دعاء الصباح", timeOfDay: "morning", spiritualNote: "كان النبي ﷺ يقولها ثلاثاً حين يصبح وحين يمسي", orderIndex: 8, isFeatured: false },
  { phraseAr: "حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم", transliteration: "Hasbiyallahu la ilaha illa Huwa alayhi tawakkaltu wa Huwa Rabbul-arshil-azeem", translationAr: "التوكل على الله", meaning: "Allah is sufficient for me, there is no god but Him, I put my trust in Him", recommendedCount: 7, category: "دعاء الصباح", timeOfDay: "morning", spiritualNote: "من قالها سبع مرات كفاه الله ما أهمه من أمر الدنيا والآخرة", orderIndex: 9, isFeatured: false },
  { phraseAr: "بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم", transliteration: "Bismillahilladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'i wa Huwas-Sami'ul-Aleem", translationAr: "التحصين باسم الله", meaning: "In the name of Allah, with whose name nothing is harmed on earth or in heaven", recommendedCount: 3, category: "دعاء الصباح", timeOfDay: "morning", spiritualNote: "من قالها ثلاثاً لم تصبه فجأة بلاء", orderIndex: 10, isFeatured: false },
  { phraseAr: "رضيت بالله رباً وبالإسلام ديناً وبمحمد ﷻ نبياً", transliteration: "Raditu billahi Rabba, wa bil-Islami dina, wa bi-Muhammadin ﷺ nabiyya", translationAr: "الرضا بالله", meaning: "I am pleased with Allah as Lord, Islam as religion, and Muhammad as Prophet", recommendedCount: 3, category: "دعاء الصباح", timeOfDay: "morning", spiritualNote: "كان حقاً على الله أن يرضيه يوم القيامة", orderIndex: 11, isFeatured: false },
  { phraseAr: "يا حي يا قيوم برحمتك أستغيث أصلح لي شأني كله ولا تكلني إلى نفسي طرفة عين", transliteration: "Ya Hayyu Ya Qayyum, bi-rahmatika astaghith, aslih li sha'ni kullahu wa la takilni ila nafsi tarfata ayn", translationAr: "الاستغاثة", meaning: "O Ever-Living, O Sustainer, by Your mercy I seek help, rectify all my affairs", recommendedCount: 1, category: "دعاء الصباح", timeOfDay: "morning", spiritualNote: "دعاء عظيم للإصلاح والتوفيق", orderIndex: 12, isFeatured: false },

  // ═══ AFTERNOON (ظهر / عصر) ═══
  { phraseAr: "أستغفر الله", transliteration: "Astaghfirullah", translationAr: "طلب المغفرة", meaning: "I seek forgiveness from Allah", recommendedCount: 100, category: "استغفار", timeOfDay: "afternoon", spiritualNote: "من لزم الاستغفار جعل الله له من كل ضيق مخرجاً", orderIndex: 13, isFeatured: true },
  { phraseAr: "لا حول ولا قوة إلا بالله", transliteration: "La hawla wa la quwwata illa billah", translationAr: "كنز من كنوز الجنة", meaning: "No power nor strength except with Allah", recommendedCount: 100, category: "حوقلة", timeOfDay: "afternoon", spiritualNote: "كنز من كنوز الجنة", orderIndex: 14, isFeatured: true },
  { phraseAr: "سبحان الله العظيم وبحمده", transliteration: "SubhanAllahi al-Azeem wa bihamdihi", translationAr: "تنزيه الله العظيم", meaning: "Glory be to Allah the Magnificent and His praise", recommendedCount: 100, category: "تسبيح", timeOfDay: "afternoon", spiritualNote: "كلمتان حبيبتان إلى الرحمن، خفيفتان على اللسان، ثقيلتان في الميزان", orderIndex: 15, isFeatured: true },
  { phraseAr: "اللهم إني أسألك الهدى والتقى والعفاف والغنى", transliteration: "Allahumma inni as'alukal-huda wat-tuqa wal-afafa wal-ghina", translationAr: "سؤال الخير", meaning: "O Allah, I ask You for guidance, piety, chastity, and contentment", recommendedCount: 1, category: "دعاء", timeOfDay: "afternoon", spiritualNote: "كان النبي ﷺ يكثر من هذا الدعاء", orderIndex: 16, isFeatured: false },
  { phraseAr: "اللهم إني أعوذ بك من العجز والكسل والجبن والبخل والهرم وعذاب القبر", transliteration: "Allahumma inni a'udhu bika minal-ajzi wal-kasali wal-jubni wal-bukhri wal-harami wa adhabil-qabr", translationAr: "الاستعاذة من الشرور", meaning: "O Allah, I seek refuge in You from incapacity, laziness, cowardice, miserliness, old age, and torment of the grave", recommendedCount: 1, category: "دعاء", timeOfDay: "afternoon", spiritualNote: "دعاء شامل من ست آفات", orderIndex: 17, isFeatured: false },
  { phraseAr: "اللهم إني أعوذ بك من علم لا ينفع، ومن قلب لا يخشع، ومن نفس لا تشبع، ومن دعوة لا يستجاب لها", transliteration: "Allahumma inni a'udhu bika min ilmin la yanfa', wa min qalbin la yakhsha', wa min nafsin la tashba', wa min da'watin la yustajabu laha", translationAr: "الاستعاذة", meaning: "O Allah, I seek refuge in You from knowledge that does not benefit, a heart that does not humble itself", recommendedCount: 1, category: "دعاء", timeOfDay: "afternoon", spiritualNote: "من أجمع أدعية الاستعاذة", orderIndex: 18, isFeatured: false },
  { phraseAr: "سبحان الله والحمد لله ولا إله إلا الله والله أكبر", transliteration: "SubhanAllahi wal-hamdu lillahi wa la ilaha illallahu wallahu Akbar", translationAr: "الباقينات", meaning: "Glory be to Allah, praise be to Allah, there is no god but Allah, Allah is the Greatest", recommendedCount: 100, category: "تسبيح", timeOfDay: "afternoon", spiritualNote: "الباقيات الصالحات، أحب إلى النبي ﷺ مما طلعت عليه الشمس", orderIndex: 19, isFeatured: false },
  { phraseAr: "اللهم اغفر لي ذنبي كله، دقه وجله، وأوله وآخره، وعلانيته وسره", transliteration: "Allahumma-ghfir li dhanbi kullahu, diqqahu wa jillahu, wa awwalahu wa akhirahu, wa alaniyyatahu wa sirrahu", translationAr: "طلب المغفرة الشاملة", meaning: "O Allah, forgive me all my sins, small and great, first and last, open and secret", recommendedCount: 1, category: "استغفار", timeOfDay: "afternoon", spiritualNote: "من أجمع أدعية الاستغفار", orderIndex: 20, isFeatured: false },
  { phraseAr: "لا إله إلا الله", transliteration: "La ilaha illallah", translationAr: "كلمة التوحيد", meaning: "There is no god but Allah", recommendedCount: 100, category: "تهليل", timeOfDay: "afternoon", spiritualNote: "أفضل ما قلت أنا والنبيون من قبلي", orderIndex: 21, isFeatured: true },
  { phraseAr: "اللهم صل وسلم على نبينا محمد", transliteration: "Allahumma salli wa sallim ala nabiyyina Muhammad", translationAr: "الصلاة على النبي", meaning: "O Allah, send blessings and peace upon our Prophet Muhammad", recommendedCount: 100, category: "صلاة على النبي", timeOfDay: "afternoon", spiritualNote: "من صلى عليّ صلاة صلى الله عليه بها عشراً", orderIndex: 22, isFeatured: false },

  // ═══ EVENING (مغرب / عشاء) ═══
  { phraseAr: "اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد", transliteration: "Allahumma salli ala Muhammadin wa ala ali Muhammadin kama sallayta ala Ibrahima wa ala ali Ibrahima innaka Hamidun Majid", translationAr: "الصلاة الإبراهيمية", meaning: "O Allah, send blessings upon Muhammad and his family as You sent blessings upon Ibrahim", recommendedCount: 10, category: "صلاة على النبي", timeOfDay: "evening", spiritualNote: "الصلاة الإبراهيمية في التشهد", orderIndex: 23, isFeatured: true },
  { phraseAr: "أعوذ بكلمات الله التامات من شر ما خلق", transliteration: "A'udhu bi-kalimatillahit-tammati min sharri ma khalaq", translationAr: "الاستعاذة بكلمات الله", meaning: "I seek refuge in the perfect words of Allah from the evil of what He has created", recommendedCount: 3, category: "استعاذة", timeOfDay: "evening", spiritualNote: "من قالها لم يضره شيء حتى يصبح", orderIndex: 24, isFeatured: false },
  { phraseAr: "اللهم إني أمسيت أشهدك وأشهد حملة عرشك وملائكتك وجميع خلقك أنك أنت الله لا إله إلا أنت وحدك لا شريك لك وأن محمداً عبدك ورسولك", transliteration: "Allahumma inni amsaytu ush-hiduka wa ush-hidu hamalata arshika wa mala'ikataka wa jami'a khalqika annaka antallahu la ilaha illa anta wahdaka la sharika laka wa anna Muhammadan abduka wa rasuluk", translationAr: "دعاء المساء", meaning: "O Allah, I have reached the evening and call You to witness", recommendedCount: 4, category: "دعاء المساء", timeOfDay: "evening", spiritualNote: "من قالها أربع مرات حين يمسي أعتقه الله من النار", orderIndex: 25, isFeatured: false },
  { phraseAr: "اللهم ما أمسى بي من نعمة أو بأحد من خلقك فمنك وحدك لا شريك لك، فلك الحمد ولك الشكر", transliteration: "Allahumma ma amsa bi min ni'matin aw bi ahadin min khalqika faminka wahdaka la sharika lak, falakal-hamdu wa lakash-shukr", translationAr: "شكر نعمة المساء", meaning: "O Allah, whatever blessing I have reached the evening with is from You alone", recommendedCount: 1, category: "دعاء المساء", timeOfDay: "evening", spiritualNote: "من قالها حين يمسي فقد أدى شكر ليلته", orderIndex: 26, isFeatured: false },
  { phraseAr: "اللهم إني أسألك الجنة وما قرب إليها من قول أو عمل، وأعوذ بك من النار وما قرب إليها من قول أو عمل", transliteration: "Allahumma inni as'alukal-Jannata wa ma qarraba ilayha min qawlin aw amal, wa a'udhu bika minan-Nari wa ma qarraba ilayha min qawlin aw amal", translationAr: "سؤال الجنة والاستعاذة من النار", meaning: "O Allah, I ask You for Paradise and what draws one closer to it, and I seek refuge from the Fire", recommendedCount: 1, category: "دعاء المساء", timeOfDay: "evening", spiritualNote: "من أجمع الأدعية", orderIndex: 27, isFeatured: false },
  { phraseAr: "ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار", transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhab an-Nar", translationAr: "دعاء شامل", meaning: "Our Lord, give us good in this world and good in the Hereafter", recommendedCount: 33, category: "دعاء", timeOfDay: "evening", spiritualNote: "كان النبي ﷺ يكثر من هذا الدعاء", orderIndex: 28, isFeatured: false },
  { phraseAr: "اللهم إني أعوذ بك من الهم والحزن، والعجز والكسل، والبخل والجبن، وضلع الدين وغلبة الرجال", transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan, wal-ajzi wal-kasal, wal-bukhri wal-jubn, wa dala'id-dayni wa ghalabatir-rijal", translationAr: "الاستعاذة من الهموم", meaning: "O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and being overpowered by men", recommendedCount: 1, category: "دعاء المساء", timeOfDay: "evening", spiritualNote: "من أعظم أدعية الاستعاذة", orderIndex: 29, isFeatured: false },
  { phraseAr: "أمسينا وأمسى الملك لله والحمد لله، لا إله إلا الله وحده لا شريك له", transliteration: "Amsayna wa amsal-mulku lillahi wal-hamdu lillah, la ilaha illallahu wahdahu la sharika lah", translationAr: "ذكر المساء", meaning: "We have reached the evening and at this very time unto Allah belongs all sovereignty", recommendedCount: 1, category: "دعاء المساء", timeOfDay: "evening", spiritualNote: "من أذكار المساء الجامعة", orderIndex: 30, isFeatured: false },

  // ═══ NIGHT (قبل النوم) ═══
  { phraseAr: "اللهم إني أسألك الجنة", transliteration: "Allahumma inni as'aluka al-Jannah", translationAr: "سؤال الجنة", meaning: "O Allah, I ask You for Paradise", recommendedCount: 33, category: "دعاء", timeOfDay: "night", spiritualNote: "من سأل الله الجنة ثلاثاً قالت الجنة: اللهم أدخله الجنة", orderIndex: 31, isFeatured: true },
  { phraseAr: "أعوذ بالله من النار", transliteration: "A'udhu billahi min an-Nar", translationAr: "الاستعاذة من النار", meaning: "I seek refuge in Allah from the Fire", recommendedCount: 33, category: "دعاء", timeOfDay: "night", spiritualNote: "من تعوذ بالله من النار ثلاثاً قالت النار: اللهم أجره من النار", orderIndex: 32, isFeatured: true },
  { phraseAr: "رب اغفر لي وتب علي إنك أنت التواب الغفور", transliteration: "Rabbighfir li wa tub alayya innaka antat-Tawwab al-Ghafoor", translationAr: "طلب المغفرة والتوبة", meaning: "My Lord, forgive me and accept my repentance", recommendedCount: 100, category: "استغفار", timeOfDay: "night", spiritualNote: "سيد الاستغفار", orderIndex: 33, isFeatured: true },
  { phraseAr: "اللهم باسمك أموت وأحيا", transliteration: "Allahumma bismika amutu wa ahya", translationAr: "دعاء النوم", meaning: "O Allah, in Your name I die and I live", recommendedCount: 1, category: "دعاء النوم", timeOfDay: "night", spiritualNote: "كان النبي ﷺ يقولها إذا أوى إلى فراشه", orderIndex: 34, isFeatured: false },
  { phraseAr: "سبحان الله (33) الحمد لله (33) الله أكبر (34)", transliteration: "SubhanAllah (33) Alhamdulillah (33) Allahu Akbar (34)", translationAr: "تسبيح فاطمة", meaning: "The Tasbih of Fatimah - Glory, Praise, and Greatness of Allah", recommendedCount: 100, category: "تسبيح", timeOfDay: "night", spiritualNote: "وصية النبي ﷺ لفاطمة وعلي رضي الله عنهما قبل النوم", orderIndex: 35, isFeatured: false },
  { phraseAr: "اللهم قني عذابك يوم تبعث عبادك", transliteration: "Allahumma qini adhabaka yawma tab'athu ibadak", translationAr: "دعاء قبل النوم", meaning: "O Allah, protect me from Your punishment on the Day You resurrect Your servants", recommendedCount: 3, category: "دعاء النوم", timeOfDay: "night", spiritualNote: "كان النبي ﷺ يقولها ثلاثاً عند النوم", orderIndex: 36, isFeatured: false },
  { phraseAr: "اللهم رب السماوات السبع ورب العرش العظيم، ربنا ورب كل شيء، فالق الحب والنوى، ومنزل التوراة والإنجيل والفرقان، أعوذ بك من شر كل شيء أنت آخذ بناصيته", transliteration: "Allahumma Rabbas-samawatis-sab'i wa Rabbal-arshil-azeem, Rabbana wa Rabba kulli shay'in, Faliqal-habbi wan-nawa, wa Munazzilat-Tawrati wal-Injili wal-Furqan, a'udhu bika min sharri kulli shay'in anta akhidhun binasiyatih", translationAr: "دعاء شامل", meaning: "O Allah, Lord of the seven heavens and the Mighty Throne, our Lord and Lord of all things", recommendedCount: 1, category: "دعاء النوم", timeOfDay: "night", spiritualNote: "من أجمع أدعية النبي ﷺ", orderIndex: 37, isFeatured: false },
  { phraseAr: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير", transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa ala kulli shay'in qadir", translationAr: "كلمة التوحيد", meaning: "There is no god but Allah alone", recommendedCount: 100, category: "تهليل", timeOfDay: "night", spiritualNote: "كان النبي ﷺ يقولها قبل النوم", orderIndex: 38, isFeatured: false },
  { phraseAr: "اللهم إني أسلمت نفسي إليك، ووجهت وجهي إليك، وفوضت أمري إليك، وألجأت ظهري إليك، رغبة ورهبة إليك، لا ملجأ ولا منجا منك إلا إليك، آمنت بكتابك الذي أنزلت وبنبيك الذي أرسلت", transliteration: "Allahumma inni aslamtu nafsi ilayk, wa wajjahtu wajhi ilayk, wa fawwadtu amri ilayk, wa alja'tu zahri ilayk, raghbatan wa rahbatan ilayk, la malja'a wa la manja minka illa ilayk, amantu bi-kitabikal-ladhi anzalt wa bi-nabiyyikal-ladhi arsalt", translationAr: "دعاء النوم الشامل", meaning: "O Allah, I submit myself to You, I turn my face to You, I entrust my affair to You", recommendedCount: 1, category: "دعاء النوم", timeOfDay: "night", spiritualNote: "من قالها فمات من ليلته فقد مات على الفطرة", orderIndex: 39, isFeatured: false },

  // ═══ GENERAL (كل وقت - Hajj specific) ═══
  { phraseAr: "لبيك اللهم لبيك، لبيك لا شريك لك لبيك، إن الحمد والنعمة لك والملك، لا شريك لك", transliteration: "Labbayk Allahumma labbayk, labbayk la sharika laka labbayk, innal-hamda wan-ni'mata laka wal-mulk, la sharika lak", translationAr: "التلبية", meaning: "Here I am O Allah, here I am. Here I am, You have no partner, here I am", recommendedCount: 100, category: "تلبية", timeOfDay: "general", spiritualNote: "التلبية شعار الحجيج", orderIndex: 40, isFeatured: true },
  { phraseAr: "سبحان الله", transliteration: "SubhanAllah", translationAr: "تنزيه الله", meaning: "Glory be to Allah", recommendedCount: 100, category: "تسبيح", timeOfDay: "general", spiritualNote: "أحب الكلام إلى الله", orderIndex: 41, isFeatured: false },
  { phraseAr: "اللهم صل على محمد", transliteration: "Allahumma salli ala Muhammad", translationAr: "الصلاة على النبي", meaning: "O Allah, send blessings upon Muhammad", recommendedCount: 100, category: "صلاة على النبي", timeOfDay: "general", spiritualNote: "من صلى عليّ صلاة صلى الله عليه بها عشراً", orderIndex: 42, isFeatured: false },
  { phraseAr: "أستغفر الله العظيم وأتوب إليه", transliteration: "Astaghfirullaha al-Azeem wa atubu ilayh", translationAr: "الاستغفار", meaning: "I seek forgiveness from Allah the Magnificent and repent to Him", recommendedCount: 100, category: "استغفار", timeOfDay: "general", spiritualNote: "كان النبي ﷺ يستغفر في المجلس الواحد أكثر من سبعين مرة", orderIndex: 43, isFeatured: false },
  { phraseAr: "لا إله إلا أنت سبحانك إني كنت من الظالمين", transliteration: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin", translationAr: "دعاء ذي النون", meaning: "There is no god but You, glory be to You, I was among the wrongdoers", recommendedCount: 40, category: "دعاء", timeOfDay: "general", spiritualNote: "دعاء يونس في بطن الحوت - ما دعا بها مسلم إلا استجاب الله له", orderIndex: 44, isFeatured: false },
  { phraseAr: "اللهم إني ظلمت نفسي ظلماً كثيراً ولا يغفر الذنوب إلا أنت، فاغفر لي مغفرة من عندك وارحمني إنك أنت الغفور الرحيم", transliteration: "Allahumma inni zalamtu nafsi zulman kathiran wa la yaghfirudh-dhunuba illa ant, faghfir li maghfiratan min indika warhamni innaka antal-Ghafurur-Rahim", translationAr: "سيد الاستغفار", meaning: "O Allah, I have wronged myself greatly and none forgives sins except You", recommendedCount: 1, category: "استغفار", timeOfDay: "general", spiritualNote: "سيد الاستغفار - من قالها موقناً بها حين يمسي فمات دخل الجنة", orderIndex: 45, isFeatured: false },
  { phraseAr: "رب اشرح لي صدري ويسر لي أمري واحلل عقدة من لساني يفقهوا قولي", transliteration: "Rabbishrah li sadri, wa yassir li amri, wahlul uqdatan min lisani, yafqahu qawli", translationAr: "دعاء موسى", meaning: "My Lord, expand my chest, ease my task, and untie the knot from my tongue", recommendedCount: 7, category: "دعاء", timeOfDay: "general", spiritualNote: "دعاء موسى عليه السلام", orderIndex: 46, isFeatured: false },
  { phraseAr: "ربنا لا تؤاخذنا إن نسينا أو أخطأنا، ربنا ولا تحمل علينا إصراً كما حملته على الذين من قبلنا", transliteration: "Rabbana la tu'akhidhna in nasina aw akhta'na, Rabbana wa la tahmil alayna isran kama hamaltahu alal-ladhina min qablina", translationAr: "دعاء شامل", meaning: "Our Lord, do not impose blame upon us if we forget or err, and do not lay upon us a burden", recommendedCount: 7, category: "دعاء", timeOfDay: "general", spiritualNote: "من آيات سورة البقرة", orderIndex: 47, isFeatured: false },
  { phraseAr: "ربنا هب لنا من أزواجنا وذرياتنا قرة أعين واجعلنا للمتقين إماماً", transliteration: "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yunin waj'alna lil-muttaqina imama", translationAr: "دعاء الأسرة", meaning: "Our Lord, grant us from our spouses and offspring comfort to our eyes", recommendedCount: 7, category: "دعاء", timeOfDay: "general", spiritualNote: "من دعاء الصالحين", orderIndex: 48, isFeatured: false },
  { phraseAr: "ربنا اغفر لنا ولإخواننا الذين سبقونا بالإيمان ولا تجعل في قلوبنا غلاً للذين آمنوا ربنا إنك رءوف رحيم", transliteration: "Rabbanaghfir lana wa li-ikhwaninal-ladhina sabaquna bil-imani wa la taj'al fi qulubina ghillan lilladhina amanu Rabbana innaka Ra'ufun Rahim", translationAr: "دعاء للمؤمنين", meaning: "Our Lord, forgive us and our brothers who preceded us in faith", recommendedCount: 7, category: "دعاء", timeOfDay: "general", spiritualNote: "من سورة الحشر", orderIndex: 49, isFeatured: false },
  { phraseAr: "سبحان الله وبحمده سبحان الله العظيم", transliteration: "SubhanAllahi wa bihamdihi, SubhanAllahi al-Azeem", translationAr: "التسبيح المزدوج", meaning: "Glory be to Allah and His praise, Glory be to Allah the Magnificent", recommendedCount: 100, category: "تسبيح", timeOfDay: "general", spiritualNote: "كلمتان خفيفتان على اللسان ثقيلتان في الميزان", orderIndex: 50, isFeatured: false },
  { phraseAr: "الله أكبر كبيراً والحمد لله كثيراً وسبحان الله بكرة وأصيلاً", transliteration: "Allahu Akbar kabira, wal-hamdu lillahi kathira, wa SubhanAllahi bukratan wa asila", translationAr: "التعظيم والحمد", meaning: "Allah is the Greatest, greatly, and praise be to Allah abundantly, and glory be to Allah morning and evening", recommendedCount: 33, category: "تسبيح", timeOfDay: "general", spiritualNote: "كان النبي ﷺ يقولها كثيراً", orderIndex: 51, isFeatured: false },
  { phraseAr: "اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي وأبوء بذنبي فاغفر لي فإنه لا يغفر الذنوب إلا أنت", transliteration: "Allahumma anta Rabbi la ilaha illa ant, khalaqtani wa ana abduk, wa ana ala ahdika wa wa'dika mastata't, a'udhu bika min sharri ma sana't, abu'u laka bini'matika alayya wa abu'u bidhanbi faghfir li fa-innahu la yaghfirudh-dhunuba illa ant", translationAr: "سيد الاستغفار", meaning: "O Allah, You are my Lord, there is no god but You. You created me and I am Your servant", recommendedCount: 1, category: "استغفار", timeOfDay: "general", spiritualNote: "سيد الاستغفار - من قالها موقناً بها فمات دخل الجنة", orderIndex: 52, isFeatured: false },
  { phraseAr: "ربنا تقبل منا إنك أنت السميع العليم وتب علينا إنك أنت التواب الرحيم", transliteration: "Rabbana taqabbal minna innaka antas-Sami'ul-Aleem wa tub alayna innaka antat-Tawwabur-Rahim", translationAr: "دعاء القبول", meaning: "Our Lord, accept from us, indeed You are the All-Hearing, All-Knowing, and accept our repentance", recommendedCount: 7, category: "دعاء", timeOfDay: "general", spiritualNote: "دعاء إبراهيم وإسماعيل عليهما السلام عند بناء الكعبة", orderIndex: 53, isFeatured: false },
  { phraseAr: "ربنا ظلمنا أنفسنا وإن لم تغفر لنا وترحمنا لنكونن من الخاسرين", transliteration: "Rabbana zalamna anfusina wa il-lam taghfir lana wa tarhamna lanakunanna minal-khasirin", translationAr: "دعاء آدم", meaning: "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers", recommendedCount: 7, category: "دعاء", timeOfDay: "general", spiritualNote: "دعاء آدم وحواء عليهما السلام", orderIndex: 54, isFeatured: false },
];

let _presetsSeeded = false;
async function ensurePresetsSeeded() {
  if (_presetsSeeded) return;
  try {
    const [existing] = await db.select({ count: count() }).from(tasbihPresetsTable);
    if (Number(existing.count) === 0) {
      console.log(`Seeding ${PRESETS.length} tasbih presets...`);
      await db.insert(tasbihPresetsTable).values(PRESETS);
      console.log("Tasbih presets seeded successfully.");
    } else {
      console.log(`Tasbih presets already exist (${existing.count} records).`);
    }
    _presetsSeeded = true;
  } catch (err) {
    console.error("Error seeding tasbih presets:", err);
    throw err;
  }
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9) return "morning";
  if (hour >= 9 && hour < 12) return "morning";
  if (hour >= 12 && hour < 15) return "afternoon";
  if (hour >= 15 && hour < 18) return "evening";
  if (hour >= 18 && hour < 21) return "evening";
  return "night";
}

router.get("/tasbih/presets", requireAuth, async (req, res): Promise<void> => {
  try {
    await ensurePresetsSeeded();
    const presets = await db
      .select()
      .from(tasbihPresetsTable)
      .orderBy(tasbihPresetsTable.orderIndex);

    res.json(presets);
  } catch (err) {
    console.error("Error fetching presets:", err);
    res.status(500).json({ error: "Failed to fetch presets" });
  }
});

router.get("/tasbih/active", requireAuth, async (req, res): Promise<void> => {
  try {
    const today = TODAY();

    const [session] = await db
      .select()
      .from(userTasbihSessionsTable)
      .where(
        and(
          eq(userTasbihSessionsTable.userId, req.userId!),
          eq(userTasbihSessionsTable.date, today),
          eq(userTasbihSessionsTable.status, "active")
        )
      )
      .orderBy(desc(userTasbihSessionsTable.startedAt))
      .limit(1);

    if (!session) {
      res.status(404).json({ error: "لا توجد جلسة نشطة" });
      return;
    }

    const [preset] = await db
      .select()
      .from(tasbihPresetsTable)
      .where(eq(tasbihPresetsTable.id, session.presetId))
      .limit(1);

    res.json({ ...session, preset: preset ?? null });
  } catch (err) {
    console.error("Error fetching active tasbih session:", err);
    res.status(500).json({ error: "Failed to fetch active session" });
  }
});

router.post("/tasbih/select", requireAuth, async (req, res): Promise<void> => {
  const { presetId, targetCount } = req.body as { presetId: string; targetCount?: number };

  if (!presetId) {
    res.status(400).json({ error: "presetId مطلوب" });
    return;
  }

  const [preset] = await db
    .select()
    .from(tasbihPresetsTable)
    .where(eq(tasbihPresetsTable.id, presetId))
    .limit(1);

  if (!preset) {
    res.status(404).json({ error: "التسبيحة غير موجودة" });
    return;
  }

  const today = TODAY();

  const [existing] = await db
    .select()
    .from(userTasbihSessionsTable)
    .where(
      and(
        eq(userTasbihSessionsTable.userId, req.userId!),
        eq(userTasbihSessionsTable.date, today),
        eq(userTasbihSessionsTable.status, "active")
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(userTasbihSessionsTable)
      .set({
        presetId,
        targetCount: targetCount ?? preset.recommendedCount,
        currentCount: 0,
        status: "active",
      })
      .where(eq(userTasbihSessionsTable.id, existing.id));

    const [updated] = await db
      .select()
      .from(userTasbihSessionsTable)
      .where(eq(userTasbihSessionsTable.id, existing.id))
      .limit(1);

    res.json({ ...updated, preset });
    return;
  }

  const [session] = await db
    .insert(userTasbihSessionsTable)
    .values({
      userId: req.userId!,
      presetId,
      targetCount: targetCount ?? preset.recommendedCount,
      currentCount: 0,
      roundsCompleted: 0,
      totalCount: 0,
      status: "active",
      date: today,
    })
    .returning();

  res.status(201).json({ ...session, preset });
});

router.post("/tasbih/increment", requireAuth, async (req, res): Promise<void> => {
  const today = TODAY();

  const [session] = await db
    .select()
    .from(userTasbihSessionsTable)
    .where(
      and(
        eq(userTasbihSessionsTable.userId, req.userId!),
        eq(userTasbihSessionsTable.date, today),
        eq(userTasbihSessionsTable.status, "active")
      )
    )
    .orderBy(desc(userTasbihSessionsTable.startedAt))
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "لا توجد جلسة نشطة" });
    return;
  }

  const newCount = session.currentCount + 1;
  const newTotal = session.totalCount + 1;

  const [updated] = await db
    .update(userTasbihSessionsTable)
    .set({
      currentCount: newCount,
      totalCount: newTotal,
    })
    .where(eq(userTasbihSessionsTable.id, session.id))
    .returning();

  const [preset] = await db
    .select()
    .from(tasbihPresetsTable)
    .where(eq(tasbihPresetsTable.id, updated.presetId))
    .limit(1);

  res.json({ ...updated, preset: preset ?? null });
});

router.post("/tasbih/reset-round", requireAuth, async (req, res): Promise<void> => {
  const today = TODAY();

  const [session] = await db
    .select()
    .from(userTasbihSessionsTable)
    .where(
      and(
        eq(userTasbihSessionsTable.userId, req.userId!),
        eq(userTasbihSessionsTable.date, today),
        eq(userTasbihSessionsTable.status, "active")
      )
    )
    .orderBy(desc(userTasbihSessionsTable.startedAt))
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "لا توجد جلسة نشطة" });
    return;
  }

  const [updated] = await db
    .update(userTasbihSessionsTable)
    .set({
      currentCount: 0,
      roundsCompleted: session.roundsCompleted + 1,
    })
    .where(eq(userTasbihSessionsTable.id, session.id))
    .returning();

  const [preset] = await db
    .select()
    .from(tasbihPresetsTable)
    .where(eq(tasbihPresetsTable.id, updated.presetId))
    .limit(1);

  res.json({ ...updated, preset: preset ?? null });
});

router.get("/tasbih/history", requireAuth, async (req, res): Promise<void> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startDate = sevenDaysAgo.toISOString().slice(0, 10);

  const stats = await db
    .select({
      date: userTasbihSessionsTable.date,
      totalCount: sql<number>`COALESCE(SUM(${userTasbihSessionsTable.totalCount}), 0)`,
      roundsCompleted: sql<number>`COALESCE(SUM(${userTasbihSessionsTable.roundsCompleted}), 0)`,
      sessionCount: sql<number>`COUNT(DISTINCT ${userTasbihSessionsTable.id})`,
    })
    .from(userTasbihSessionsTable)
    .where(
      and(
        eq(userTasbihSessionsTable.userId, req.userId!),
        sql`${userTasbihSessionsTable.date} >= ${startDate}`
      )
    )
    .groupBy(userTasbihSessionsTable.date)
    .orderBy(userTasbihSessionsTable.date);

  res.json(stats);
});

router.get("/tasbih/contextual-adhkar", requireAuth, async (req, res): Promise<void> => {
  try {
    await ensurePresetsSeeded();
    const timeOfDay = getTimeOfDay();

    const excludeMap: Record<string, string[]> = {
      morning: ["night", "evening"],
      afternoon: ["night"],
      evening: ["morning"],
      night: ["morning", "afternoon"],
    };

    const exclude = excludeMap[timeOfDay] || [];

    const presets = await db
      .select()
      .from(tasbihPresetsTable)
      .where(
        sql`${tasbihPresetsTable.timeOfDay} = ${timeOfDay} OR ${tasbihPresetsTable.timeOfDay} = 'general'`
      )
      .orderBy(tasbihPresetsTable.orderIndex);

    res.json(presets);
  } catch (err) {
    console.error("Error fetching contextual adhkar:", err);
    res.status(500).json({ error: "Failed to fetch contextual adhkar" });
  }
});

export default router;
