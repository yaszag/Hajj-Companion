import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { HajjButton } from "./hajj-button";

export type HajjDialogType = "confirm" | "success" | "warning" | "danger" | "info";

const accent: Record<HajjDialogType, string> = {
  confirm: "bg-primary",
  success: "bg-sunnah",
  warning: "bg-wajib",
  danger: "bg-rukn",
  info: "bg-gold",
};

export interface HajjDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: HajjDialogType;
  emoji: string;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
}

export function HajjDialog({
  open,
  onOpenChange,
  type,
  emoji,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  onConfirm,
}: HajjDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm animate-fade-in data-[state=open]:animate-in"
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[201] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-modal border border-border bg-surface p-0 shadow-float outline-none",
            "animate-scale-in data-[state=open]:animate-in data-[state=closed]:animate-out",
          )}
          dir="rtl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className={cn("h-1 w-full rounded-t-modal", accent[type])} />
          <div className="flex flex-col items-center px-6 pb-6 pt-2 text-center">
            <div className="mb-3 text-5xl leading-none" aria-hidden>
              {emoji}
            </div>
            <DialogPrimitive.Title className="mb-2 text-lg font-bold text-foreground">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mb-6 text-sm leading-relaxed text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-center">
              <HajjButton
                type="button"
                variant="ghost"
                className="min-h-11 flex-1"
                onClick={() => onOpenChange(false)}
              >
                {cancelLabel}
              </HajjButton>
              <HajjButton
                type="button"
                variant={type === "danger" ? "danger" : "primary"}
                className="min-h-11 flex-1"
                onClick={() => {
                  onConfirm?.();
                  onOpenChange(false);
                }}
              >
                {confirmLabel}
              </HajjButton>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
