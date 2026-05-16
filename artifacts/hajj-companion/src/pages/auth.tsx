import React from "react";
import { Link, useLocation } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import {
  useLogin,
  useRegister,
} from "@workspace/api-client-react";
import {
  HajjButton,
  HajjInput,
  HajjNationalitySelect,
  useHajjToast,
} from "@/components/ui/hajj";
import { cn } from "@/lib/utils";

const nameRegex = /^[\u0600-\u06FFa-zA-Z\s'\-]+$/;

const loginSchema = z.object({
  phone: z.string().min(1, "أدخل رقم هاتفك"),
  password: z.string().min(1, "أدخل كلمة المرور"),
});

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "الاسم قصير جداً")
      .regex(nameRegex, "يسمح بالأحرف فقط"),
    lastName: z
      .string()
      .min(2, "اللقب قصير جداً")
      .regex(nameRegex, "يسمح بالأحرف فقط"),
    nationality: z.string().length(2, "اختر جنسيتك"),
    groupName: z.string().min(3, "اسم الفوج قصير جداً").max(100),
    hotelName: z.string().min(2, "اسم الفندق مطلوب").max(200),
    phone: z.string().regex(/^\+?[0-9]{8,15}$/, "رقم الهاتف غير صحيح"),
    password: z
      .string()
      .min(8, "8 أحرف على الأقل")
      .regex(/[0-9]/, "يجب أن تحتوي على رقم")
      .regex(/[a-zA-Z]/, "يجب أن تحتوي على حرف"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
  });

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

function passwordStrength(pw: string) {
  if (pw.length < 8) return { level: 1 as const, label: "ضعيفة" };
  const hasNum = /[0-9]/.test(pw);
  const hasUp = /[A-Z]/.test(pw);
  const hasSpec = /[^A-Za-z0-9]/.test(pw);
  if (hasNum && hasUp && hasSpec) return { level: 4 as const, label: "قوية" };
  if (hasNum || hasUp) return { level: 3 as const, label: "جيدة" };
  return { level: 2 as const, label: "متوسطة" };
}

function isRecordWithStatus(e: unknown): e is { status: number; data?: { error?: string } | null } {
  return typeof e === "object" && e !== null && "status" in e && typeof (e as { status: unknown }).status === "number";
}

function apiErrorMessage(err: unknown): string | undefined {
  if (!isRecordWithStatus(err)) return undefined;
  const d = err.data;
  if (d && typeof d === "object" && "error" in d && typeof (d as { error: unknown }).error === "string") {
    return (d as { error: string }).error;
  }
  return undefined;
}

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useHajjToast();
  const isRegister = location === "/auth";

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const [shakeLogin, setShakeLogin] = React.useState(false);
  const [shakeRegister, setShakeRegister] = React.useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { phone: "+216", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      nationality: "",
      groupName: "",
      hotelName: "",
      phone: "+216",
      password: "",
      confirmPassword: "",
    },
  });

  const regPwd = registerForm.watch("password");
  const strength = passwordStrength(regPwd ?? "");

  React.useEffect(() => {
    if (isAuthenticated) setLocation("/");
  }, [isAuthenticated, setLocation]);

  if (isAuthenticated) return null;

  const onLoginSubmit = loginForm.handleSubmit((values) => {
    loginMutation.mutate(
      { data: { phone: values.phone.trim(), password: values.password } },
      {
        onSuccess: (data) => {
          login(data.accessToken, data.user, data.refreshToken);
          toast({ type: "success", message: "✅ تم تسجيل الدخول بنجاح" });
          setLocation("/");
        },
        onError: (err) => {
          setShakeLogin(true);
          window.setTimeout(() => setShakeLogin(false), 500);
          const msg = "رقم الهاتف أو كلمة المرور غير صحيحة";
          loginForm.setError("phone", { message: msg });
          loginForm.setError("password", { message: msg });
          if (!isRecordWithStatus(err) || err.status !== 401) {
            toast({ type: "error", message: "❌ حدث خطأ، حاول مجدداً" });
          }
        },
      },
    );
  });

  const scrollToFirstRegisterError = () => {
    const order: (keyof RegisterValues)[] = [
      "firstName",
      "lastName",
      "nationality",
      "groupName",
      "hotelName",
      "phone",
      "password",
      "confirmPassword",
    ];
    for (const key of order) {
      if (registerForm.formState.errors[key]) {
        const el = document.getElementById(String(key));
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
      }
    }
  };

  const onRegisterSubmit = registerForm.handleSubmit(
    async (values) => {
      try {
        const data = await registerMutation.mutateAsync({
          data: {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            nationality: values.nationality.toUpperCase(),
            phone: values.phone.trim(),
            password: values.password,
            hotelName: values.hotelName.trim(),
            groupName: values.groupName.trim(),
          },
        });

        login(data.accessToken, data.user, data.refreshToken);

        toast({ type: "success", message: "✅ تم إنشاء الحساب بنجاح" });
        setLocation("/");
      } catch (err) {
        if (isRecordWithStatus(err) && err.status === 409) {
          const msg = apiErrorMessage(err) ?? "رقم الهاتف مستخدم بالفعل";
          toast({ type: "error", message: `❌ ${msg}` });
          if (msg.includes("هاتف")) registerForm.setFocus("phone");
          return;
        }
        toast({ type: "error", message: "❌ حدث خطأ، حاول مجدداً" });
      }
    },
    () => {
      setShakeRegister(true);
      window.setTimeout(() => setShakeRegister(false), 500);
      scrollToFirstRegisterError();
    },
  );

  return (
    <div className="auth-page min-h-screen">
      <div className="auth-pattern" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col px-5 py-8">
        <div className="mb-8 flex flex-col items-center pt-6">
          <div className="auth-kaaba-icon mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface shadow-lg ring-1 ring-gold/30">
            <span className="text-3xl">🕋</span>
          </div>
          <h1 className="font-amiri text-2xl font-bold text-foreground">رفيق الحج</h1>
          <p className="mt-1 text-sm text-muted-foreground">رفيقك الأمين في رحلة العمر</p>

          <div className="mt-6 flex w-full max-w-xs overflow-hidden rounded-xl bg-surface p-1 shadow-card">
            <button
              type="button"
              onClick={() => !isRegister ? null : setLocation("/login")}
              className={cn(
                "auth-tab flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-300",
                !isRegister ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => isRegister ? null : setLocation("/auth")}
              className={cn(
                "auth-tab flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-300",
                isRegister ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              حساب جديد
            </button>
          </div>
        </div>

        <div className="auth-card flex-1 rounded-2xl bg-surface p-6 shadow-card ring-1 ring-border/50">
          {!isRegister ? (
            <form
              onSubmit={onLoginSubmit}
              className={cn("space-y-5", shakeLogin && "animate-shake")}
              noValidate
            >
              <div className="auth-field animate-slide-up">
                <HajjInput
                  label="رقم الهاتف"
                  name="phone"
                  register={loginForm.register("phone")}
                  value={loginForm.watch("phone")}
                  error={loginForm.formState.errors.phone?.message}
                  dir="ltr"
                  prefix={<span className="font-mono text-xs">📱</span>}
                  autoComplete="tel"
                />
              </div>

              <div className="auth-field animate-slide-up stagger-1">
                <HajjInput
                  label="كلمة المرور"
                  name="password"
                  type="password"
                  register={loginForm.register("password")}
                  value={loginForm.watch("password")}
                  error={loginForm.formState.errors.password?.message}
                  autoComplete="current-password"
                />
              </div>

              <div className="auth-field flex justify-end animate-slide-up stagger-2">
                <button
                  type="button"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary-dark min-h-11 px-1"
                  onClick={() =>
                    toast({
                      type: "info",
                      message: "ℹ️ تواصل مع مشرف مجموعتك أو الدعم لاستعادة كلمة المرور",
                    })
                  }
                >
                  نسيت كلمة المرور؟
                </button>
              </div>

              <div className="auth-field animate-slide-up stagger-2">
                <HajjButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "جاري الدخول..." : "تسجيل الدخول"}
                </HajjButton>
              </div>

              <div className="auth-divider relative py-3 animate-slide-up stagger-3">
                <hr className="border-border" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-3 text-xs text-muted-foreground">
                  أو
                </span>
              </div>

              <div className="auth-field animate-slide-up stagger-3">
                <HajjButton
                  type="button"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={() => setLocation("/auth")}
                >
                  إنشاء حساب جديد
                </HajjButton>
              </div>
            </form>
          ) : (
            <form
              onSubmit={onRegisterSubmit}
              className={cn("space-y-4", shakeRegister && "animate-shake")}
              noValidate
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="auth-field animate-slide-up">
                  <HajjInput
                    label="الاسم"
                    name="firstName"
                    register={registerForm.register("firstName")}
                    value={registerForm.watch("firstName")}
                    error={registerForm.formState.errors.firstName?.message}
                    autoComplete="given-name"
                  />
                </div>
                <div className="auth-field animate-slide-up stagger-1">
                  <HajjInput
                    label="اللقب"
                    name="lastName"
                    register={registerForm.register("lastName")}
                    value={registerForm.watch("lastName")}
                    error={registerForm.formState.errors.lastName?.message}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="auth-field animate-slide-up stagger-2" id="nationality">
                <Controller
                  name="nationality"
                  control={registerForm.control}
                  render={({ field }) => (
                    <HajjNationalitySelect
                      value={field.value}
                      onChange={field.onChange}
                      error={registerForm.formState.errors.nationality?.message}
                    />
                  )}
                />
              </div>

              <div className="auth-field animate-slide-up stagger-2">
                <HajjInput
                  label="اسم الفوج"
                  name="groupName"
                  register={registerForm.register("groupName")}
                  value={registerForm.watch("groupName")}
                  error={registerForm.formState.errors.groupName?.message}
                  placeholder="مثال: فوج النور"
                />
              </div>

              <div className="auth-field animate-slide-up stagger-3">
                <HajjInput
                  label="اسم الفندق / الإقامة"
                  name="hotelName"
                  register={registerForm.register("hotelName")}
                  value={registerForm.watch("hotelName")}
                  error={registerForm.formState.errors.hotelName?.message}
                />
              </div>

              <div className="auth-field animate-slide-up stagger-3">
                <HajjInput
                  label="رقم الهاتف"
                  name="phone"
                  register={registerForm.register("phone")}
                  value={registerForm.watch("phone")}
                  error={registerForm.formState.errors.phone?.message}
                  placeholder="+216..."
                  dir="ltr"
                  prefix={<span className="font-mono text-xs whitespace-nowrap">🇹🇳 +216</span>}
                  autoComplete="tel"
                />
              </div>

              <div className="auth-field animate-slide-up stagger-4">
                <HajjInput
                  label="كلمة المرور"
                  name="password"
                  type="password"
                  register={registerForm.register("password")}
                  value={registerForm.watch("password")}
                  error={registerForm.formState.errors.password?.message}
                  autoComplete="new-password"
                />
                <PasswordStrengthBar strength={strength} />
              </div>

              <div className="auth-field animate-slide-up stagger-5">
                <HajjInput
                  label="تأكيد كلمة المرور"
                  name="confirmPassword"
                  type="password"
                  register={registerForm.register("confirmPassword")}
                  value={registerForm.watch("confirmPassword")}
                  error={registerForm.formState.errors.confirmPassword?.message}
                  autoComplete="new-password"
                />
              </div>

              <div className="auth-field animate-slide-up stagger-5">
                <HajjButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={registerMutation.isPending}
                  className="mt-2"
                >
                  {registerMutation.isPending ? "جاري الإنشاء..." : "إنشاء الحساب"}
                </HajjButton>
              </div>

              <p className="auth-field pt-2 text-center text-sm text-muted-foreground animate-slide-up stagger-5">
                لديك حساب؟{" "}
                <Link href="/login" className="font-semibold text-primary transition-colors hover:text-primary-dark">
                  تسجيل الدخول
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordStrengthBar({
  strength,
}: {
  strength: ReturnType<typeof passwordStrength>;
}) {
  const { level, label } = strength;
  const segClass = (i: number) => {
    if (i > level) return "bg-surface2";
    if (level === 1) return "bg-rukn";
    if (level === 2) return "bg-wajib";
    if (level === 3) return "bg-gold";
    return "bg-sunnah";
  };
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 overflow-hidden rounded-pill transition-all duration-300",
              segClass(i),
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
