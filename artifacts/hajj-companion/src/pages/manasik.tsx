import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetManasik, useUpdateManasikProgress, ManasikItemStatus, ManasikProgressUpdateStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManasikPage() {
  const { data: manasikItems, isLoading, refetch } = useGetManasik();
  const updateProgress = useUpdateManasikProgress();

  const handleUpdateStatus = (key: string, currentStatus: ManasikItemStatus) => {
    let nextStatus: ManasikProgressUpdateStatus = "in_progress";
    if (currentStatus === "pending") nextStatus = "in_progress";
    else if (currentStatus === "in_progress") nextStatus = "completed";
    else return; // already completed

    updateProgress.mutate({
      key,
      data: { status: nextStatus }
    }, {
      onSuccess: () => {
        refetch();
      }
    });
  };

  const getStatusIcon = (status: ManasikItemStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case "in_progress":
        return <Clock className="w-6 h-6 text-secondary" />;
      case "pending":
      default:
        return <Circle className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: ManasikItemStatus) => {
    switch (status) {
      case "completed": return "مكتمل";
      case "in_progress": return "قيد التنفيذ";
      case "pending": return "قادم";
    }
  };

  return (
    <AppLayout title="مناسكي">
      <div className="p-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))
        ) : manasikItems && manasikItems.length > 0 ? (
          manasikItems.sort((a, b) => a.order - b.order).map((item) => (
            <Card 
              key={item.key} 
              className={`border-l-4 transition-colors ${item.status === 'completed' ? 'border-l-green-500 bg-green-50/50' : item.status === 'in_progress' ? 'border-l-secondary bg-secondary/5' : 'border-l-border'} cursor-pointer hover:bg-muted/50`}
              onClick={() => handleUpdateStatus(item.key, item.status)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(item.status)}
                  <div>
                    <h3 className={`font-semibold ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                      {item.titleAr}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getStatusText(item.status)} {item.day ? `• اليوم ${item.day}` : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            لا توجد مناسك حالياً
          </div>
        )}
      </div>
    </AppLayout>
  );
}
