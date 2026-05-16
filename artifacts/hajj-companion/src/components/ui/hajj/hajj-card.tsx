import * as React from "react";
import { cn } from "@/lib/utils";

export interface HajjCardProps extends React.HTMLAttributes<HTMLDivElement> {
  clickable?: boolean;
}

export function HajjCard({ className, clickable, children, ...props }: HajjCardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-4 shadow-card",
        clickable &&
          "cursor-pointer transition-shadow hover:shadow-float active:scale-[0.99]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
