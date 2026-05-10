import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Phone, MapPin, Globe, CreditCard, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <AppLayout title="الملف الشخصي">
      <div className="p-4 space-y-6">
        
        <div className="flex flex-col items-center py-6">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg mb-4">
            <User className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold">{user?.fullNameAr}</h2>
          {user?.fullNameEn && (
            <p className="text-muted-foreground text-sm" dir="ltr">{user.fullNameEn}</p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">بيانات الحاج</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">رقم الجواز</p>
                <p className="font-medium" dir="ltr">{user?.passportNo}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">الجنسية</p>
                <p className="font-medium">{user?.nationality}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                <p className="font-medium" dir="ltr">{user?.phone}</p>
              </div>
            </div>
            
            {user?.tentZone && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">منطقة المخيم</p>
                    <p className="font-medium">{user.tentZone}</p>
                  </div>
                </div>
              </>
            )}

          </CardContent>
        </Card>

        {user?.emergencyContact && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">جهة اتصال الطوارئ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">رقم الطوارئ</p>
                  <p className="font-medium" dir="ltr">{user.emergencyContact}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button 
          variant="outline" 
          className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive" 
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 ml-2" />
          تسجيل الخروج
        </Button>

      </div>
    </AppLayout>
  );
}
