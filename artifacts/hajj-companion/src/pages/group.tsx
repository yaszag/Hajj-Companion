import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useGetGroup, useGetGroupMembers, useJoinGroup, useCreateGroup } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Copy, Share2, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function GroupPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [inviteCode, setInviteCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [isCreateMode, setIsCreateMode] = useState(false);
  
  const { data: group, isLoading: isGroupLoading, refetch: refetchGroup } = useGetGroup(user?.groupId || "");
  const { data: members, isLoading: isMembersLoading } = useGetGroupMembers(user?.groupId || "");

  const joinGroup = useJoinGroup();
  const createGroup = useCreateGroup();

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;
    
    joinGroup.mutate({
      data: { inviteCode }
    }, {
      onSuccess: () => {
        toast({ title: "تم الانضمام للمجموعة بنجاح" });
        window.location.reload(); // Quick way to refresh context
      },
      onError: () => {
        toast({ title: "رمز الدعوة غير صحيح", variant: "destructive" });
      }
    });
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) return;
    
    createGroup.mutate({
      data: { nameAr: groupName }
    }, {
      onSuccess: () => {
        toast({ title: "تم إنشاء المجموعة بنجاح" });
        window.location.reload();
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "تم نسخ الرمز" });
  };

  // No Group State
  if (!user?.groupId) {
    return (
      <AppLayout title="مجموعتي">
        <div className="p-4 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Users className="w-12 h-12 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">لست منضماً لأي مجموعة</h2>
          <p className="text-muted-foreground text-center mb-8">
            الانضمام لمجموعة يساعدك على البقاء على تواصل مع رفقائك وتحديد مواقعهم
          </p>
          
          {isCreateMode ? (
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>إنشاء مجموعة جديدة</CardTitle>
              </CardHeader>
              <form onSubmit={handleCreateGroup}>
                <CardContent className="space-y-4">
                  <Input 
                    placeholder="اسم المجموعة (مثل: حملة النور)" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={createGroup.isPending}>
                      إنشاء
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsCreateMode(false)}>
                      إلغاء
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          ) : (
            <Card className="w-full max-w-md mb-4">
              <CardHeader>
                <CardTitle>الانضمام لمجموعة قائمة</CardTitle>
              </CardHeader>
              <form onSubmit={handleJoinGroup}>
                <CardContent className="space-y-4">
                  <Input 
                    placeholder="أدخل رمز الدعوة (6 أرقام)" 
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    dir="ltr"
                    className="text-center font-mono tracking-widest text-lg"
                    maxLength={6}
                  />
                  <Button type="submit" className="w-full" disabled={joinGroup.isPending}>
                    انضمام
                  </Button>
                </CardContent>
              </form>
            </Card>
          )}
          
          {!isCreateMode && (
            <Button variant="link" onClick={() => setIsCreateMode(true)} className="mt-4">
              أو قم بإنشاء مجموعة جديدة كقائد
            </Button>
          )}
        </div>
      </AppLayout>
    );
  }

  // Has Group State
  return (
    <AppLayout title="مجموعتي">
      <div className="p-4 space-y-6">
        
        {/* Group Info Card */}
        <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-10 -translate-x-10 pointer-events-none" />
          
          <CardContent className="p-6 relative z-10">
            {isGroupLoading ? (
              <Skeleton className="h-20 w-full bg-primary-foreground/20" />
            ) : group ? (
              <>
                <h2 className="text-2xl font-bold mb-1">{group.nameAr}</h2>
                <div className="flex items-center text-primary-foreground/80 text-sm mb-6">
                  <Users className="w-4 h-4 ml-1" />
                  <span>{group.memberCount} أعضاء</span>
                </div>
                
                <div className="bg-white/10 p-4 rounded-xl flex items-center justify-between backdrop-blur-sm">
                  <div>
                    <p className="text-xs text-primary-foreground/70 mb-1">رمز الدعوة للمجموعة</p>
                    <p className="font-mono text-xl font-bold tracking-widest" dir="ltr">{group.inviteCode}</p>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="hover:bg-white/20 text-white rounded-full"
                    onClick={() => copyToClipboard(group.inviteCode)}
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
        
        {/* Members List */}
        <div>
          <h3 className="font-semibold text-lg mb-4 px-1">أعضاء المجموعة</h3>
          
          <div className="space-y-3">
            {isMembersLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))
            ) : members && members.length > 0 ? (
              members.map(member => (
                <Card key={member.id} className="border-border shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary relative">
                        <span className="font-bold text-lg">{member.fullNameAr.charAt(0)}</span>
                        {/* Status dot - mock logic: consider everyone online for prototype */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold">{member.fullNameAr} {member.id === user.id ? "(أنت)" : ""}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <a href={`tel:${member.phone}`} className="text-xs text-muted-foreground flex items-center hover:text-primary transition-colors">
                            <Phone className="w-3 h-3 ml-1" />
                            {member.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    {member.id !== user.id && (
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
                        <MapPin className="w-5 h-5" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : null}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
