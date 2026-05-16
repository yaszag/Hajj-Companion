import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface BottomDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function BottomDrawer({
  open,
  onOpenChange,
  children,
  title,
  className,
}: BottomDrawerProps) {
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setVisible(true));
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        cancelAnimationFrame(id);
        document.body.style.overflow = prev;
      };
    }
    setVisible(false);
    return;
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end" role="presentation">
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          visible ? "opacity-100 animate-fade-in" : "opacity-0",
        )}
        aria-label="إغلاق"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "relative z-[101] w-full max-h-[85vh] overflow-hidden rounded-t-modal bg-surface shadow-float transition-transform ease-out",
          visible ? "translate-y-0" : "translate-y-full",
          className,
        )}
        style={{ transitionDuration: "350ms" }}
      >
        <div className="flex flex-col items-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-pill bg-border" aria-hidden />
        </div>
        {title ? (
          <h2 className="px-4 pb-2 text-center text-base font-semibold text-foreground">{title}</h2>
        ) : null}
        <div className="max-h-[min(70vh,560px)] overflow-y-auto overscroll-contain pb-safe">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
