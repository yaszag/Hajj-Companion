import * as React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HajjInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "prefix" | "type"> {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  prefix?: React.ReactNode;
  register: UseFormRegisterReturn;
  /** Pass `watch(name)` from react-hook-form for floating label when typing */
  value?: string;
}

export const HajjInput = React.forwardRef<HTMLInputElement, HajjInputProps>(
  (
    {
      label,
      name,
      type = "text",
      placeholder,
      error,
      success,
      hint,
      prefix,
      register,
      value,
      className,
      disabled,
      onBlur,
      onChange,
      onFocus,
      ...rest
    },
    forwardedRef,
  ) => {
    const [showPwd, setShowPwd] = React.useState(false);
    const [focused, setFocused] = React.useState(false);
    const innerRef = React.useRef<HTMLInputElement | null>(null);

    const isPassword = type === "password";
    const inputType = isPassword && showPwd ? "text" : type;

    const mergedRef = (el: HTMLInputElement | null) => {
      innerRef.current = el;
      register.ref(el);
      if (typeof forwardedRef === "function") forwardedRef(el);
      else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
    };

    const hasValue = Boolean((value ?? innerRef.current?.value ?? "").length > 0);
    const floated = focused || hasValue;

    const stateRing =
      error != null && error !== ""
        ? "border-rukn animate-shake"
        : success
          ? "border-sunnah"
          : "border-border focus-within:border-primary focus-within:shadow-focus";

    return (
      <div className={cn("w-full", className)}>
        <div
          className={cn(
            "relative flex min-h-[52px] items-stretch rounded-card border-2 bg-surface px-3 transition-all duration-200",
            stateRing,
            disabled && "opacity-60",
          )}
        >
          {prefix ? (
            <span className="flex shrink-0 items-center pe-2 text-sm text-muted-foreground">{prefix}</span>
          ) : null}

          <div className="relative min-h-[52px] flex-1">
            <label
              htmlFor={name}
              className={cn(
                "pointer-events-none absolute end-0 z-[1] origin-top-right transition-all duration-200",
                floated
                  ? "top-1.5 text-xs font-medium text-primary"
                  : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
              )}
            >
              {label}
            </label>

            {/* Password: status icons on physical left, eye toggle on physical right — avoids overlap with RTL text */}
            {isPassword && success && !error ? (
              <span
                className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 text-sunnah animate-scale-in"
                aria-hidden
              >
                <Check className="size-5" strokeWidth={2.5} />
              </span>
            ) : null}
            {isPassword && error ? (
              <span
                className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 text-rukn"
                aria-hidden
              >
                <AlertTriangle className="size-5" />
              </span>
            ) : null}

            <input
              id={name}
              {...rest}
              name={name}
              disabled={disabled}
              placeholder={floated ? placeholder : undefined}
              type={inputType}
              className={cn(
                "h-full w-full min-h-[52px] bg-transparent pb-2 pt-6 text-base text-foreground outline-none",
                isPassword && "pr-12",
                isPassword && (error || (success && !error)) && "pl-10",
                rest.dir === "ltr" ? "text-left" : "text-right",
              )}
              ref={mergedRef}
              onBlur={(e) => {
                setFocused(false);
                register.onBlur(e);
                onBlur?.(e);
              }}
              onChange={(e) => {
                register.onChange(e);
                onChange?.(e);
              }}
              onFocus={(e) => {
                setFocused(true);
                onFocus?.(e);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
            />

            {isPassword ? (
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 z-20 flex size-11 min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-card text-muted-foreground hover:bg-surface2 hover:text-foreground"
                aria-label={showPwd ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                onClick={() => setShowPwd((v) => !v)}
              >
                {showPwd ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            ) : null}
          </div>

          {!isPassword && success && !error ? (
            <span className="flex shrink-0 items-center ps-1 text-sunnah animate-scale-in" aria-hidden>
              <Check className="size-5" strokeWidth={2.5} />
            </span>
          ) : null}

          {!isPassword && error ? (
            <span className="flex shrink-0 items-center ps-1 text-rukn" aria-hidden>
              <AlertTriangle className="size-5" />
            </span>
          ) : null}
        </div>

        {error ? (
          <p id={`${name}-error`} role="alert" className="mt-1 animate-slide-down text-xs text-rukn">
            {error}
          </p>
        ) : hint ? (
          <p id={`${name}-hint`} className="mt-1 text-xs text-hint">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
HajjInput.displayName = "HajjInput";
