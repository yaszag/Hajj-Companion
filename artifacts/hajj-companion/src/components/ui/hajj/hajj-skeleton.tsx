import * as React from "react";
import { cn } from "@/lib/utils";

const shimmer =
  "bg-gradient-to-r from-surface2 via-border to-surface2 bg-[length:200%_100%] animate-shimmer";

export function HajjSkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("h-4 rounded-lg", shimmer, className)} {...props} />;
}

export function HajjSkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("size-12 shrink-0 rounded-full", shimmer, className)} {...props} />;
}

export function HajjSkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3 rounded-card border border-border p-4", className)} {...props}>
      <HajjSkeletonText className="h-5 w-2/3" />
      <HajjSkeletonText className="h-3 w-full" />
      <HajjSkeletonText className="h-3 w-5/6" />
    </div>
  );
}
