import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type HajjToastType = "success" | "error" | "info" | "warning";

export interface HajjToastInput {
  type: HajjToastType;
  message: string;
}

type ToastRecord = HajjToastInput & { id: string };

const ToastCtx = React.createContext<{
  toast: (t: HajjToastInput) => void;
} | null>(null);

function iconFor(type: HajjToastType) {
  switch (type) {
    case "success":
      return "✅";
    case "error":
      return "❌";
    case "info":
      return "ℹ️";
    case "warning":
      return "⚠️";
    default:
      return "";
  }
}

function ToastViewport({ toasts, onDismiss }: { toasts: ToastRecord[]; onDismiss: (id: string) => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="pointer-events-none fixed left-1/2 top-4 z-[300] flex w-[min(100%-2rem,28rem)] -translate-x-1/2 flex-col gap-2"
      dir="rtl"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-start gap-2 rounded-card border border-border bg-surface px-3 py-3 text-foreground shadow-float animate-slide-down border-e-4",
            t.type === "success" && "border-e-sunnah",
            t.type === "error" && "border-e-rukn",
            t.type === "info" && "border-e-gold",
            t.type === "warning" && "border-e-wajib",
          )}
        >
          <button
            type="button"
            className="ms-auto text-hint hover:text-foreground"
            aria-label="إغلاق"
            onClick={() => onDismiss(t.id)}
          >
            ×
          </button>
          <p className="min-w-0 flex-1 text-right text-sm font-medium leading-snug text-foreground">
            <span className="me-1" aria-hidden>
              {iconFor(t.type)}
            </span>
            {t.message}
          </p>
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function HajjToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastRecord[]>([]);
  const timers = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = React.useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toast = React.useCallback(
    (input: HajjToastInput) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now());
      setToasts((prev) => [...prev, { ...input, id }]);
      const tid = setTimeout(() => dismiss(id), 3000);
      timers.current.set(id, tid);
    },
    [dismiss],
  );

  React.useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

/** App-level toast (top-center, 3s). Distinct from `@/hooks/use-toast` (Radix). */
export function useHajjToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error("useHajjToast must be used within HajjToastProvider");
  return ctx;
}
