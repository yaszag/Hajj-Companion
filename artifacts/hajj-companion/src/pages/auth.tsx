import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Star } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  if (isAuthenticated) {
    setLocation("/");
    return null;
  }

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  // Login form state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regPassport, setRegPassport] = useState("");
  const [regName, setRegName] = useState("");
  const [regNationality, setRegNationality] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone || !loginPassword) return;

    loginMutation.mutate({
      data: { phone: loginPhone, password: loginPassword }
    }, {
      onSuccess: (data) => {
        login(data.accessToken, data.user);
        toast({ title: "تم تسجيل الدخول بنجاح" });
        setLocation("/");
      },
      onError: (error) => {
        toast({ 
          title: "خطأ في تسجيل الدخول", 
          description: error.data?.error || "الرجاء التحقق من البيانات والمحاولة مرة أخرى",
          variant: "destructive" 
        });
      }
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPassport || !regName || !regNationality || !regPhone || !regPassword) {
      toast({ title: "الرجاء إكمال جميع الحقول", variant: "destructive" });
      return;
    }

    registerMutation.mutate({
      data: {
        passportNo: regPassport,
        fullNameAr: regName,
        nationality: regNationality,
        phone: regPhone,
        password: regPassword
      }
    }, {
      onSuccess: (data) => {
        login(data.accessToken, data.user);
        toast({ title: "تم إنشاء الحساب بنجاح" });
        setLocation("/");
      },
      onError: (error) => {
        toast({ 
          title: "خطأ في التسجيل", 
          description: error.data?.error || "حدث خطأ أثناء إنشاء الحساب",
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Moon className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">رفيق الحج</h1>
          <p className="text-muted-foreground">دليلك الموثوق في رحلتك الإيمانية</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">دخول</TabsTrigger>
            <TabsTrigger value="register">حساب جديد</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card className="border-primary/20 shadow-md">
              <CardHeader>
                <CardTitle>تسجيل الدخول</CardTitle>
                <CardDescription>أدخل رقم هاتفك وكلمة المرور للمتابعة</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input 
                      id="phone" 
                      placeholder="05xxxxxxxx" 
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      dir="ltr"
                      className="text-right"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      dir="ltr"
                      className="text-right"
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "جاري الدخول..." : "دخول"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="register">
            <Card className="border-primary/20 shadow-md">
              <CardHeader>
                <CardTitle>حساب جديد</CardTitle>
                <CardDescription>أدخل بياناتك لإنشاء حساب جديد</CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">الاسم الثلاثي (بالعربية)</Label>
                    <Input 
                      id="reg-name" 
                      placeholder="أحمد محمد علي" 
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-passport">رقم الجواز</Label>
                    <Input 
                      id="reg-passport" 
                      placeholder="A1234567" 
                      value={regPassport}
                      onChange={(e) => setRegPassport(e.target.value)}
                      dir="ltr"
                      className="text-right"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-nationality">الجنسية (رمز الدولة)</Label>
                    <Input 
                      id="reg-nationality" 
                      placeholder="SA" 
                      maxLength={2}
                      value={regNationality}
                      onChange={(e) => setRegNationality(e.target.value.toUpperCase())}
                      dir="ltr"
                      className="text-right"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-phone">رقم الهاتف</Label>
                    <Input 
                      id="reg-phone" 
                      placeholder="05xxxxxxxx" 
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      dir="ltr"
                      className="text-right"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">كلمة المرور</Label>
                    <Input 
                      id="reg-password" 
                      type="password" 
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      dir="ltr"
                      className="text-right"
                      minLength={6}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "جاري التسجيل..." : "تسجيل"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
