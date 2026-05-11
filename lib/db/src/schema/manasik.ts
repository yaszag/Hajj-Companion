import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const manasikProgressTable = pgTable(
  "manasik_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    mansakKey: varchar("mansak_key", { length: 30 }).notNull(),
    status: varchar("status", { length: 15 }).default("pending").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    unique("uniq_user_mansak").on(table.userId, table.mansakKey),
  ]
);

export const manasikProgressHistoryTable = pgTable("manasik_progress_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  mansakKey: varchar("mansak_key", { length: 30 }).notNull(),
  fromStatus: varchar("from_status", { length: 15 }).notNull(),
  toStatus: varchar("to_status", { length: 15 }).notNull(),
  note: text("note"),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertManasikProgressSchema = createInsertSchema(manasikProgressTable).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});
export type InsertManasikProgress = z.infer<typeof insertManasikProgressSchema>;
export type ManasikProgress = typeof manasikProgressTable.$inferSelect;

export type ManasikCategory = "rukn" | "wajib" | "sunnah";
export type NusukType = "ifrad" | "tamattu" | "qiran";

export interface ManasikStep {
  title: string;
  detail: string;
  category: ManasikCategory;
}

export interface ManasikItem {
  key: string;
  titleAr: string;
  titleEn: string;
  order: number;
  day: number;
  descriptionAr: string;
  category: ManasikCategory;
  nusukTypes: NusukType[];
  steps: ManasikStep[];
  commonMistakes: Array<{ wrong: string; right: string }>;
  malikirNote: string;
  practicalTip: string;
}

// Static manasik data — Maliki madhab is primary reference
export const MANASIK_LIST: ManasikItem[] = [
  {
    key: "ihram",
    titleAr: "الإحرام",
    titleEn: "Ihram",
    order: 1,
    day: 8,
    descriptionAr: "ارتداء ملابس الإحرام والنية للحج من الميقات",
    category: "rukn",
    nusukTypes: ["ifrad", "tamattu", "qiran"],
    steps: [
      { title: "الاغتسال والتطيب", detail: "يُستحب الاغتسال والتطيب للجسد قبل ارتداء الإحرام", category: "sunnah" },
      { title: "ارتداء الإحرام", detail: "يرتدي الرجل إزاراً ورداءً أبيضين، والمرأة تُحرم في ثيابها العادية", category: "wajib" },
      { title: "النية", detail: "النية في القلب هي ركن الإحرام — ينوي الحج تحديداً", category: "rukn" },
      { title: "التلبية", detail: "يُلبّي قائلاً: لبيك اللهم لبيك... ويستمر في التلبية حتى رمي جمرة العقبة", category: "wajib" },
    ],
    commonMistakes: [
      { wrong: "يظن بعضهم أن لبس ملابس الإحرام هو الإحرام نفسه", right: "الإحرام هو النية، وارتداء الملابس سابق له" },
      { wrong: "التطيب بعد الإحرام على الجسد", right: "يُتطيب قبل الإحرام على الجسد فقط، لا على الملابس" },
    ],
    malikirNote: "الإحرام ركن لا يصح الحج بدونه، والنية شرطه الأساسي. الإحرام من الميقات واجب عند المالكية.",
    practicalTip: "الإحرام من مطار الملك عبدالعزيز أو من الميقات مباشرة. تأكد من حمل الحقيبة المخصصة بعد الإحرام.",
  },
  {
    key: "tawaf_qudum",
    titleAr: "طواف القدوم",
    titleEn: "Tawaf al-Qudum",
    order: 2,
    day: 8,
    descriptionAr: "الطواف الترحيبي حول الكعبة المشرفة عند الوصول",
    category: "sunnah",
    nusukTypes: ["ifrad", "qiran"],
    steps: [
      { title: "الوصول إلى المسجد الحرام", detail: "يدخل بالقدم اليمنى قائلاً دعاء دخول المسجد", category: "sunnah" },
      { title: "الاضطباع", detail: "يضع الرداء تحت إبطه الأيمن ويُلقيه على كتفه الأيسر", category: "sunnah" },
      { title: "الطواف سبعة أشواط", detail: "يبدأ من الحجر الأسود ويسير عكس عقارب الساعة سبعة أشواط", category: "rukn" },
      { title: "الرمل في الأشواط الثلاثة الأولى", detail: "يُسرع المشي قليلاً في الأشواط الثلاثة الأولى", category: "sunnah" },
    ],
    commonMistakes: [
      { wrong: "يبدأ الطواف من الركن اليماني", right: "يبدأ الطواف من الحجر الأسود بالاستقبال أو الإشارة" },
      { wrong: "يمسح الحجر الأسود بشدة مما يؤذي الآخرين", right: "الإشارة من بعيد كافية مع قول: بسم الله والله أكبر" },
    ],
    malikirNote: "طواف القدوم سنة عند المالكية للمفرد والقارن وليس واجباً، يختلف عن الحنابلة الذين يعدّونه واجباً.",
    practicalTip: "أفضل وقت للطواف: بعد صلاة الفجر أو في منتصف الليل لتجنب الازدحام.",
  },
  {
    key: "sai",
    titleAr: "السعي بين الصفا والمروة",
    titleEn: "Sa'i",
    order: 3,
    day: 8,
    descriptionAr: "السعي سبعة أشواط بين جبلي الصفا والمروة",
    category: "rukn",
    nusukTypes: ["ifrad", "tamattu", "qiran"],
    steps: [
      { title: "البدء من الصفا", detail: "يصعد الصفا قليلاً ويستقبل الكعبة ويكبّر ثلاثاً", category: "sunnah" },
      { title: "السعي سبعة أشواط", detail: "الذهاب من الصفا إلى المروة شوط، والعودة شوط آخر — والسبعة تنتهي بالمروة", category: "rukn" },
      { title: "الهرولة في المسعى", detail: "يُهرول الرجال بين العلمين الأخضرين في كل شوط", category: "sunnah" },
    ],
    commonMistakes: [
      { wrong: "اعتبار الذهاب والإياب شوطاً واحداً", right: "الذهاب شوط والإياب شوط، فيكون المجموع سبعة" },
      { wrong: "نسيان الدعاء على الصفا والمروة", right: "يُستحب الدعاء والتكبير عند كل صعود" },
    ],
    malikirNote: "السعي ركن عند المالكية — تركه يبطل الحج ولا يجبره دم.",
    practicalTip: "السعي له دور علوي مكيف ومناسب لكبار السن والنساء.",
  },
  {
    key: "mina_day8",
    titleAr: "المبيت في منى (يوم التروية)",
    titleEn: "Stay in Mina (Day 8)",
    order: 4,
    day: 8,
    descriptionAr: "المبيت في منى ليلة التاسع من ذي الحجة وصلاة الفرائض الخمس",
    category: "sunnah",
    nusukTypes: ["ifrad", "tamattu", "qiran"],
    steps: [
      { title: "الانتقال إلى منى", detail: "يتجه الحجاج إلى منى بعد شروق شمس اليوم الثامن", category: "wajib" },
      { title: "إقامة الصلوات", detail: "يُصلي في منى الظهر والعصر والمغرب والعشاء والفجر — مقصورة", category: "sunnah" },
      { title: "المبيت", detail: "المبيت في منى ليلة عرفة سنة عند المالكية", category: "sunnah" },
    ],
    commonMistakes: [
      { wrong: "مغادرة منى قبل الفجر للذهاب إلى عرفة", right: "يُستحب البقاء في منى حتى بعد شروق الشمس" },
    ],
    malikirNote: "المبيت في منى ليلة عرفة سنة عند المالكية، وليس واجباً — ويسقط عمن يشق عليه.",
    practicalTip: "خيام منى مكيفة — احرص على معرفة رقم خيمتك بالضبط لتسهيل العودة.",
  },
  {
    key: "wuquf_arafah",
    titleAr: "الوقوف بعرفة",
    titleEn: "Wuquf in Arafah",
    order: 5,
    day: 9,
    descriptionAr: "الركن الأعظم — الوقوف بجبل عرفات بعد الزوال حتى غروب الشمس",
    category: "rukn",
    nusukTypes: ["ifrad", "tamattu", "qiran"],
    steps: [
      { title: "الانتقال إلى عرفة", detail: "يتوجه من منى إلى عرفة بعد شروق شمس اليوم التاسع", category: "wajib" },
      { title: "الوقوف بعرفة", detail: "يقف الحاج في أي مكان من أرض عرفة — جبل الرحمة ليس شرطاً", category: "rukn" },
      { title: "الإكثار من الدعاء والذكر", detail: "أفضل دعاء يوم عرفة: لا إله إلا الله وحده لا شريك له...", category: "sunnah" },
      { title: "البقاء حتى الغروب", detail: "من أفاض قبل الغروب وجب عليه دم عند جمهور العلماء", category: "rukn" },
    ],
    commonMistakes: [
      { wrong: "الاعتقاد أن الوقوف يكون على جبل الرحمة فقط", right: "كل أرض عرفة موقف — والجبل سنة لمن استطاع" },
      { wrong: "الانصراف من عرفة قبل الغروب", right: "يجب البقاء حتى بعد غروب الشمس" },
    ],
    malikirNote: "الوقوف بعرفة الركن الأعظم — من فاته فقد فاته الحج، لا يجبره شيء.",
    practicalTip: "يوم عرفة حار جداً في الصيف — احمل ماء وفّراً واستخدم المظلة. الدعاء بين الظهر والعصر أفضل الأوقات.",
  },
  {
    key: "muzdalifah",
    titleAr: "المبيت في مزدلفة",
    titleEn: "Stay in Muzdalifah",
    order: 6,
    day: 9,
    descriptionAr: "الانتقال إلى مزدلفة بعد الغروب والمبيت فيها وجمع الحصى",
    category: "wajib",
    nusukTypes: ["ifrad", "tamattu", "qiran"],
    steps: [
      { title: "الانتقال إلى مزدلفة", detail: "يتجه بعد غروب شمس اليوم التاسع بهدوء وسكينة", category: "wajib" },
      { title: "الجمع بين المغرب والعشاء", detail: "يُجمع المغرب والعشاء في مزدلفة تأخيراً في وقت العشاء", category: "wajib" },
      { title: "المبيت حتى ما بعد منتصف الليل", detail: "واجب المبيت حتى نصف الليل على الأقل", category: "wajib" },
      { title: "جمع الحصى", detail: "يجمع ٤٩ حصاة (أو ٧٠ للمحتاط) بحجم الحمصة تقريباً", category: "sunnah" },
    ],
    commonMistakes: [
      { wrong: "مغادرة مزدلفة فور الوصول دون المبيت", right: "المبيت واجب — يجب البقاء حتى نصف الليل على الأقل" },
      { wrong: "جمع الحصى من أي مكان", right: "يُجمع الحصى من مزدلفة أو منى ولا يُغسل" },
    ],
    malikirNote: "المبيت بمزدلفة واجب عند المالكية. من تركه وجب عليه دم. يرخص للضعفة الانصراف بعد منتصف الليل.",
    practicalTip: "قدّم ذوي الأعذار والنساء مع كبار السن قبل زحام الفجر. المبيت في السيارة يُجزئ.",
  },
  {
    key: "rami_aqaba",
    titleAr: "رمي جمرة العقبة",
    titleEn: "Rami al-Aqaba",
    order: 7,
    day: 10,
    descriptionAr: "رمي جمرة العقبة الكبرى بسبع حصيات يوم العيد",
    category: "wajib",
    nusukTypes: ["ifrad", "tamattu", "qiran"],
    steps: [
      { title: "التوجه إلى منى", detail: "يتجه من مزدلفة إلى منى مع بدء إضاءة الأفق بالفجر", category: "sunnah" },
      { title: "رمي الجمرة", detail: "يرمي الجمرة الكبرى بسبع حصيات واحدة واحدة مع التكبير", category: "wajib" },
      { title: "التكبير مع كل حصاة", detail: "يقول مع كل رمية: الله أكبر", category: "sunnah" },
    ],
    commonMistakes: [
      { wrong: "رمي الحصيات دفعة واحدة", right: "يُرمى واحدة واحدة — الدفعة الواحدة تحتسب رمية واحدة فقط" },
      { wrong: "الدعاء بعد رمي جمرة العقبة", right: "لا دعاء بعد رمي العقبة — يمضي بعد رميه مباشرة" },
    ],
    malikirNote: "رمي الجمرات واجب عند المالكية — تركه يوجب الفدية. وليس ركناً كما عند بعض المذاهب.",
    practicalTip: "أفضل وقت للرمي: بعد الفجر حتى الضحى لتجنب الزحام والحر. الجسر متعدد الطوابق.",
  },
  {
    key: "nahr",
    titleAr: "النحر (الهدي)",
    titleEn: "Nahr (Sacrifice)",
    order: 8,
    day: 10,
    descriptionAr: "ذبح الهدي شكراً لله تعالى — واجب للمتمتع والقارن",
    category: "wajib",
    nusukTypes: ["tamattu", "qiran"],
    steps: [
      { title: "الذبح", detail: "يُذبح الهدي في منى أو في مكة في أيام النحر (١٠-١٣ ذي الحجة)", category: "wajib" },
      { title: "التوجه", detail: "إذا عجز عن الذبح صام عشرة أيام: ثلاثة في الحج وسبعة إذا رجع", category: "wajib" },
    ],
    commonMistakes: [
      { wrong: "يظن المفرد أن الهدي واجب عليه", right: "الهدي واجب للمتمتع والقارن فقط، لا للمفرد" },
    ],
    malikirNote: "الهدي واجب للمتمتع والقارن عند المالكية. من عجز عنه صام ثلاثة أيام في الحج وسبعة بعد العودة.",
    practicalTip: "يمكن الذبح عبر البنوك والمؤسسات المعتمدة بتوكيل. الشركة السعودية للذبائح موثوقة.",
  },
  {
    key: "taqsir",
    titleAr: "الحلق أو التقصير",
    titleEn: "Halq / Taqsir",
    order: 9,
    day: 10,
    descriptionAr: "حلق الرأس أو تقصير الشعر والتحلل من الإحرام",
    category: "wajib",
    nusukTypes: ["ifrad", "tamattu", "qiran"],
    steps: [
      { title: "الحلق أو التقصير", detail: "الحلق أفضل للرجل، والمرأة تقصر قدر أنملة من شعرها", category: "wajib" },
      { title: "التحلل الأول", detail: "بعد الحلق يحل كل شيء حُرّم بالإحرام إلا النساء والصيد والطيب", category: "rukn" },
    ],
    commonMistakes: [
      { wrong: "الحلق قبل رمي العقبة", right: "الترتيب المستحب: رمي ثم نحر ثم حلق ثم طواف" },
    ],
    malikirNote: "الحلق أو التقصير واجب لا ركن. من تركه أتى بدم.",
    practicalTip: "مشاهير المحلقين في منى كثيرون — احرص على النظافة واختر محلاً نظيفاً.",
  },
  {
    key: "tawaf_ifadah",
    titleAr: "طواف الإفاضة",
    titleEn: "Tawaf al-Ifadah",
    order: 10,
    day: 10,
    descriptionAr: "الطواف الركن — الطواف بالكعبة يوم العيد أو في أيام التشريق",
    category: "rukn",
    nusukTypes: ["ifrad", "tamattu", "qiran"],
    steps: [
      { title: "الطواف سبعة أشواط", detail: "يطوف سبعة أشواط حول الكعبة بعد الحلق", category: "rukn" },
      { title: "صلاة ركعتين", detail: "يُصلي ركعتين خلف مقام إبراهيم إن أمكن", category: "sunnah" },
      { title: "الشرب من زمزم", detail: "يشرب من ماء زمزم وهو قائم متوجه للقبلة", category: "sunnah" },
    ],
    commonMistakes: [
      { wrong: "تأخير طواف الإفاضة بعد أيام التشريق دون عذر", right: "يستحب فعله يوم العيد — يجوز تأخيره دون حد زمني مع الكراهة" },
    ],
    malikirNote: "طواف الإفاضة ركن لا يصح الحج بدونه — تركه يبطل الحج تماماً.",
    practicalTip: "احرص على الطواف في وقت الهدوء النسبي — أوقات ما بعد الظهر أو منتصف الليل.",
  },
  {
    key: "sai_ifadah",
    titleAr: "السعي بعد طواف الإفاضة",
    titleEn: "Sa'i (after Ifadah)",
    order: 11,
    day: 10,
    descriptionAr: "السعي بين الصفا والمروة بعد طواف الإفاضة إذا لم يُفعل مع طواف القدوم",
    category: "rukn",
    nusukTypes: ["tamattu"],
    steps: [
      { title: "السعي سبعة أشواط", detail: "إذا لم يسعَ مع طواف القدوم وجب السعي بعد الإفاضة", category: "rukn" },
    ],
    commonMistakes: [
      { wrong: "ترك السعي ظناً أن طواف القدوم كافٍ", right: "المتمتع يسعى بعد طواف الإفاضة حتماً إذا لم يسعَ قبلاً" },
    ],
    malikirNote: "السعي ركن، والمتمتع الذي لم يسعَ مع القدوم يلزمه السعي بعد الإفاضة.",
    practicalTip: "المسعى المسقوف ومكيف — مريح لكبار السن.",
  },
  {
    key: "mina_ayam_tashriq",
    titleAr: "المبيت في منى أيام التشريق",
    titleEn: "Mina (Days of Tashriq)",
    order: 12,
    day: 11,
    descriptionAr: "المبيت في منى ليالي الحادي عشر والثاني عشر من ذي الحجة",
    category: "wajib",
    nusukTypes: ["ifrad", "tamattu", "qiran"],
    steps: [
      { title: "المبيت ليلة ١١", detail: "واجب المبيت في منى حتى بعد منتصف الليل", category: "wajib" },
      { title: "المبيت ليلة ١٢", detail: "واجب على من لم يتعجل بالخروج قبل غروب شمس اليوم الثاني عشر", category: "wajib" },
      { title: "المبيت ليلة ١٣ (اختياري)", detail: "من أراد التأخر ليلة ثالثة فله أجر أعظم", category: "sunnah" },
    ],
    commonMistakes: [
      { wrong: "النوم خارج منى والعودة للرمي فقط", right: "المبيت داخل حدود منى واجب — لا يُجزئ المبيت خارجها" },
    ],
    malikirNote: "المبيت في منى أيام التشريق واجب — تركه يوجب الفدية. الرخصة للمعذور فقط.",
    practicalTip: "يرخص لأهل السقاية والرعاة وأصحاب الأعذار الخاصة في ترك المبيت.",
  },
  {
    key: "rami_tashriq",
    titleAr: "رمي الجمرات الثلاث",
    titleEn: "Rami (Three Jamarat)",
    order: 13,
    day: 11,
    descriptionAr: "رمي الجمرات الثلاث (الصغرى والوسطى والكبرى) في أيام التشريق",
    category: "wajib",
    nusukTypes: ["ifrad", "tamattu", "qiran"],
    steps: [
      { title: "رمي الجمرة الصغرى", detail: "يبدأ بالجمرة الصغرى ويرميها سبع حصيات ثم يدعو", category: "wajib" },
      { title: "رمي الجمرة الوسطى", detail: "يرمي الوسطى سبع حصيات ويدعو بعدها", category: "wajib" },
      { title: "رمي جمرة العقبة", detail: "يختم بالجمرة الكبرى سبع حصيات ولا دعاء بعدها", category: "wajib" },
    ],
    commonMistakes: [
      { wrong: "الرمي قبل الزوال في أيام التشريق", right: "يجب أن يكون الرمي بعد زوال الشمس في اليوم الحادي عشر والثاني عشر" },
    ],
    malikirNote: "الرمي واجب عند المالكية — من تركه وجب عليه دم. يجوز للمعذور أن يوكل غيره.",
    practicalTip: "أفضل وقت الرمي: بعد الزوال حتى قبيل الغروب. يُفضَّل أوقات الفترة (بعد الظهر).",
  },
  {
    key: "tawaf_wada",
    titleAr: "طواف الوداع",
    titleEn: "Tawaf al-Wada",
    order: 14,
    day: 13,
    descriptionAr: "آخر عهد الحاج بالبيت الحرام — واجب لغير المقيمين بمكة",
    category: "wajib",
    nusukTypes: ["ifrad", "tamattu", "qiran"],
    steps: [
      { title: "الطواف الأخير", detail: "يُطاف سبعة أشواط حول الكعبة قبيل المغادرة مباشرة", category: "wajib" },
      { title: "الالتزام بالدعاء", detail: "يُستحب الوقوف عند الملتزم والدعاء والبكاء ودّاعاً للبيت", category: "sunnah" },
      { title: "الخروج", detail: "يُستحب الخروج آخِراً بالقدم اليسرى مع النظر إلى الكعبة", category: "sunnah" },
    ],
    commonMistakes: [
      { wrong: "الشراء والتسوق بعد طواف الوداع", right: "ينبغي أن يكون طواف الوداع آخر ما يفعله قبل السفر" },
    ],
    malikirNote: "طواف الوداع واجب عند المالكية لغير أهل مكة — تركه يوجب الفدية. يسقط عن الحائض.",
    practicalTip: "ابكِ ودعُ كثيراً — قد لا تعود. اللهم لا تجعله آخر عهدنا بهذا البيت.",
  },
];
