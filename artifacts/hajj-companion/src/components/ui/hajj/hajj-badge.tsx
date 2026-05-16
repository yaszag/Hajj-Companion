import * as React from "react";
import { cn } from "@/lib/utils";

export type HajjBadgeVariant =
  | "rukn"
  | "wajib"
  | "sunnah"
  | "success"
  | "warning"
  | "info"
  | "offline";

const styles: Record<HajjBadgeVariant, string> = {
  rukn: "bg-red-100 text-rukn border border-red-200",
  wajib: "bg-amber-100 text-wajib border border-amber-200",
  sunnah: "bg-emerald-100 text-sunnah border border-emerald-200",
  success: "bg-primary-light text-primary-dark border border-primary/20",
  warning: "bg-amber-50 text-amber-800 border border-amber-200",
  info: "bg-sky-50 text-sky-800 border border-sky-200",
  offline: "bg-surface2 text-muted-foreground border border-border",
};

export interface HajjBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: HajjBadgeVariant;
  emoji?: string;
}

export function HajjBadge({ variant, emoji, className, children, ...props }: HajjBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-[11px] font-bold leading-tight",
        styles[variant],
        className,
      )}
      {...props}
    >
      {emoji ? <span aria-hidden>{emoji}</span> : null}
      {children}
    </span>
  );
}
