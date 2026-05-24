import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import AddGoalModal from "@/components/arafah/AddGoalModal";
import {
  getArafahPlan,
  incrementArafahGoal,
  completeArafahGoal,
  revertArafahGoal,
  deleteArafahGoal,
  type ArafahPlanData,
  type ArafahTimeBlock,
  type ArafahGoal,
} from "@/lib/api-client";
import {
  Sparkles, CheckCircle2, Circle, Sunrise, Sun, CloudSun, Sunset, Moon,
  Plus, Lightbulb, Target, BookHeart, RotateCcw, Trash2,
} from "lucide-react";

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  "الفجر - الشروق": <Moon className="w-4 h-4" />,
  "الصباح": <Sunrise className="w-4 h-4" />,
  "الظهر - العصر": <Sun className="w-4 h-4" />,
  "العصر - المغرب": <CloudSun className="w-4 h-4" />,
  "المغرب - العشاء": <Sunset className="w-4 h-4" />,
};

const ADVICES = [
  { text: "أكثر من قول: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير", source: "خير الدعاء دعاء يوم عرفة" },
  { text: "اجعل لنفسك وردًا من الاستغفار، فإن الله يحب المستغفرين", source: "تذكير" },
  { text: "أكثر من الصلاة على النبي ﷺ فإنها من أفضل الأعمال في هذا اليوم", source: "هدي النبي ﷺ" },
  { text: "ارفع يديك بالدعاء، فإن يوم عرفة أعظم أيام الدعاء", source: "السنة النبوية" },
  { text: "لا تنسَ الدعاء لوالديك وإخوانك المسلمين في مشارق الأرض ومغاربها", source: "وصية" },
  { text: "اجعل في قلبك رجاءً عظيمًا، فإن الله ينظر إلى أهل عرفة فيباهي بهم الملائكة", source: "صحيح مسلم" },
  { text: "أكثر من قراءة القرآن، فالحرف بعشر حسنات", source: "فضل القرآن" },
  { text: "تب إلى الله توبة نصوحًا، فإن التائب من الذنب كمن لا ذنب له", source: "ابن ماجه" },
  { text: "أكثروا من قول: لا إله إلا الله، فإنها أفضل الذكر وأثقل شيء في الميزان", source: "حديث شريف" },
  { text: "اللهم اجعل في قلبي نورًا، وفي لساني نورًا، وفي سمعي نورًا، وفي بصري نورًا", source: "دعاء نبوي" },
  { text: "ما من يوم أكثر من أن يعتق الله فيه عبدًا من النار من يوم عرفة", source: "صحيح مسلم" },
  { text: "أفضل الدعاء دعاء يوم عرفة، وأفضل ما قلت أنا والنبيون من قبلي: لا إله إلا الله وحده لا شريك له", source: "حديث شريف" },
  { text: "اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت", source: "سيد الاستغفار" },
  { text: "اجعل لك سجدة خاشعة بين يدي الله في هذا اليوم، فالعبد أقرب ما يكون من ربه وهو ساجد", source: "تأمل" },
  { text: "أكثر من الصدقة ولو بالقليل، فإن الصدقة تطفئ غضب الرب وتمنع ميتة السوء", source: "فضل الصدقة" },
  { text: "اللهم إني أسألك العفو والعافية في الدنيا والآخرة، اللهم إني أسألك الجنة وما قرب إليها من قول وعمل", source: "دعاء مأثور" },
  { text: "ذكر الله يطمئن القلوب، ويذهب الهموم، ويجلب البركات، فلا تترك لسانك رطبًا من ذكره", source: "تذكير" },
  { text: "اللهم إني ظلمت نفسي ظلمًا كثيرًا، ولا يغفر الذنوب إلا أنت، فاغفر لي مغفرة من عندك وارحمني", source: "دعاء نبوي" },
  { text: "استشعر عظمة الموقف وأنت واقف بين يدي الله، فإنما هو يوم واحد يحدد مصيرك", source: "موعظة" },
  { text: "أحسن الظن بالله، فإن الله يقول: أنا عند ظن عبدي بي، فليظن بي ما شاء", source: "حديث قدسي" },
  { text: "اللهم اكتبنا من عتقاء هذا اليوم، واجعلنا ممن تباهي بهم الملائكة يوم عرفة", source: "دعاء" },
  { text: "الدعاء يوم عرفة مستجاب بإذن الله، فلا تيأس ولا تستعجل، فإن الله يحب العبد الملح في الدعاء", source: "نصيحة" },
  { text: "أكثر من قول: سبحان الله وبحمده، سبحان الله العظيم، فهما خفيفتان على اللسان ثقيلتان في الميزان", source: "حديث شريف" },
  { text: "اللهم اهدني فيمن هديت، وعافني فيمن عافيت، وتولني فيمن توليت، وبارك لي فيما أعطيت", source: "دعاء القنوت" },
  { text: "خير ما يستقبل به يوم عرفة: الإخلاص لله، وحسن الظن به، وكثرة الدعاء والاستغفار", source: "هدي السلف" },
  { text: "اللهم لا تردنا خائبين، واغفر لنا ولوالدينا ولجميع المسلمين، إنك على كل شيء قدير", source: "دعاء" },
  { text: "أكثروا من قول: ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار", source: "القرآن الكريم" },
  { text: "اجعل نيتك خالصة لله في كل عمل تعمله اليوم، فإنما الأعمال بالنيات", source: "تذكير" },
  { text: "اللهم إنك عفو تحب العفو فاعف عنا، اللهم اغفر لنا ذنوبنا كلها: دقها وجلها، أولها وآخرها، سرها وعلانيتها", source: "دعاء مأثور" },
  { text: "لا تغفل عن التكبير والتهليل والتحميد، فهي من أحب الكلام إلى الله", source: "ذكر" },
  { text: "اللهم إني أسألك الهدى والتقى والعفاف والغنى، وأسألك الجنة وما قرب إليها من قول وعمل", source: "دعاء نبوي" },
  { text: "أبشر فإن الله يباهي بأهل عرفة الملائكة، يقول: انظروا إلى عبادي جاؤوني شعثًا غبرًا يرجون رحمتي", source: "صحيح ابن حبان" },
  { text: "اللهم اغفر لنا وارحمنا وارض عنا، وتقبل منا دعاءنا وأعمالنا، إنك أنت السميع العليم", source: "ختم دعاء" },
  { text: "أفضل الذكر لا إله إلا الله، وأفضل الدعاء الحمد لله، فلا تخلو منهما", source: "حديث شريف" },
  { text: "اللهم املأ قلوبنا بالإيمان، وألسنتنا بالذكر، وأعمالنا بالقبول، واجعلنا من الفائزين", source: "دعاء" },
  { text: "يوم عرفة هو يوم العتق من النار، فأكثروا من الدعاء والتضرع لعل الله أن يعتق رقابنا", source: "موعظة" },
  { text: "اللهم اجعل دعاءنا يوم عرفة سببًا لتغيير أحوالنا إلى الأحسن، واغفر لنا ذنوبنا كلها", source: "دعاء" },
];

const defaultIcon = <Sparkles className="w-4 h-4" />;
const CURRENT_YEAR = new Date().getFullYear();

function GoalRow({ goal, onPress, onRevert, onDelete }: {
  goal: ArafahGoal;
  onPress: (id: string) => void;
  onRevert: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const progress = goal.targetValue > 0
    ? Math.min(Math.round((goal.currentCount / goal.targetValue) * 100), 100)
    : goal.completed ? 100 : 0;

  return (
    <div
      className={`w-full flex items-center gap-2 p-3 rounded-xl transition-colors text-right ${
        goal.completed ? "bg-primary/5 opacity-70" : "bg-muted/30 hover:bg-muted/50"
      }`}
    >
      <div className="shrink-0">
        {goal.completed ? (
          <CheckCircle2 className="w-5 h-5 text-primary" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground/40" />
        )}
      </div>

      <button
        onClick={() => !goal.completed && onPress(goal.id)}
        disabled={goal.completed}
        className="flex-1 min-w-0 text-right"
      >
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium truncate ${goal.completed ? "text-muted-foreground" : ""}`}>
            {goal.titleAr}
          </p>
          <span className={`text-xs tabular-nums shrink-0 ${goal.completed ? "text-primary" : "text-muted-foreground"}`}>
            {goal.currentCount}/{goal.targetValue}
          </span>
        </div>

        {goal.targetType === "count" && !goal.completed && (
          <Progress value={progress} className="h-1 mt-1.5" />
        )}
      </button>

      {goal.completed && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onRevert(goal.id)}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            title="إلغاء الإكمال"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
            title="حذف"
          >
            <Trash2 className="w-4 h-4 text-destructive/70" />
          </button>
        </div>
      )}
    </div>
  );
}

function TimeBlockSection({ block, goals, onGoalPress, onRevert, onDelete }: {
  block: ArafahTimeBlock;
  goals: ArafahGoal[];
  onGoalPress: (id: string) => void;
  onRevert: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const completed = goals.filter((g) => g.completed).length;
  const total = goals.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="border-border/60 overflow-hidden">
      <div className="h-1.5" style={{ backgroundColor: block.moodColor || "hsl(var(--primary))" }} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">{block.startTime} - {block.endTime}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{completed}/{total}</span>
            <div className="flex items-center gap-1.5">
              {BLOCK_ICONS[block.labelAr] || defaultIcon}
              <h3 className="text-sm font-bold">{block.labelAr}</h3>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {goals.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">لا توجد أهداف في هذه الفترة</p>
          ) : (
            goals.map((goal) => (
              <GoalRow key={goal.id} goal={goal} onPress={onGoalPress} onRevert={onRevert} onDelete={onDelete} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ArafahGoalsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<ArafahPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [adviceIndex, setAdviceIndex] = useState(0);

  const fetchPlan = useCallback(async () => {
    try {
      const result = await getArafahPlan();
      setData(result);
    } catch {
      toast({ title: "حدث خطأ في تحميل خطة عرفة", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  useEffect(() => {
    if (ADVICES.length <= 1) return;
    const interval = setInterval(() => {
      setAdviceIndex((prev) => (prev + 1) % ADVICES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleGoalPress = (goalId: string) => {
    setLocation(`/arafah/goal/${goalId}/counter`);
  };

  const handleRevert = async (goalId: string) => {
    try {
      await revertArafahGoal(goalId);
      toast({ title: "تم إلغاء الإكمال" });
      fetchPlan();
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const handleDelete = async (goalId: string) => {
    try {
      await deleteArafahGoal(goalId);
      toast({ title: "تم حذف الهدف" });
      fetchPlan();
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const totalGoals = data?.goals.length || 0;
  const completedGoals = data?.goals.filter((g) => g.completed).length || 0;
  const overallPercent = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <AppLayout title="خطة يوم عرفة">
      <div className="pb-24">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-4 pb-6 mb-4">
          <div className="text-center">
            <div className="text-3xl mb-2">🤲</div>
            <h1 className="text-xl font-bold mb-1">خطة يوم عرفة</h1>
            <p className="text-xs text-muted-foreground">{CURRENT_YEAR} | يوم عرفة</p>
          </div>

          {!loading && data && (
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{completedGoals}</p>
                <p className="text-[10px] text-muted-foreground">مكتمل</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold">{totalGoals}</p>
                <p className="text-[10px] text-muted-foreground">هدف</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gold">{overallPercent}%</p>
                <p className="text-[10px] text-muted-foreground">تقدم</p>
              </div>
            </div>
          )}
        </div>

        {/* Advice ticker */}
        <div className="px-4 mb-4">
          <Card className="bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/50">
            <CardContent className="p-3 flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-100 animate-fade-in">
                  {ADVICES[adviceIndex].text}
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-300 mt-1">{ADVICES[adviceIndex].source}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="px-4 mb-4">
          <Button onClick={() => setAddOpen(true)} className="w-full h-12 text-base font-bold gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/30">
            <Plus className="w-5 h-5" />
            إضافة هدف مخصص
          </Button>
        </div>

        {/* Time Blocks */}
        <div className="px-4 space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
            ))
          ) : data ? (
            data.blocks.map((block) => {
              const blockGoals = data.goals.filter((g) => g.blockId === block.id);
              return (
                <TimeBlockSection
                  key={block.id}
                  block={block}
                  goals={blockGoals}
                  onGoalPress={handleGoalPress}
                  onRevert={handleRevert}
                  onDelete={handleDelete}
                />
              );
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground">تعذر تحميل الخطة</div>
          )}
        </div>
      </div>

      {/* Add Goal Modal */}
      {data && (
        <AddGoalModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          planId={data.plan.id}
          blocks={data.blocks}
          onGoalCreated={fetchPlan}
        />
      )}
    </AppLayout>
  );
}
