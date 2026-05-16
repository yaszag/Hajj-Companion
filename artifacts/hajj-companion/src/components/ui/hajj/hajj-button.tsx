import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export interface HajjButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const sizeClass: Record<NonNullable<HajjButtonProps["size"]>, string> = {
  sm: "min-h-9 px-3 text-sm rounded-card",
  md: "min-h-11 px-4 text-sm rounded-card",
  lg: "min-h-[52px] px-5 text-base rounded-card",
};

const variantClass: Record<HajjButtonProps["variant"], string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dark active:scale-[0.97] shadow-sm border border-transparent",
  secondary:
    "border-2 border-primary bg-transparent text-primary hover:bg-primary-light active:scale-[0.97]",
  ghost: "border border-transparent text-primary hover:bg-primary-light active:scale-[0.97]",
  danger:
    "bg-rukn text-white hover:opacity-90 active:scale-[0.97] border border-transparent",
};

export const HajjButton = React.forwardRef<HTMLButtonElement, HajjButtonProps>(
  (
    {
      className,
      variant,
      size = "md",
      loading,
      fullWidth,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50",
          sizeClass[size],
          variantClass[variant],
          fullWidth && "w-full",
          loading && "pointer-events-none",
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <Spinner className="size-5 text-current" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
HajjButton.displayName = "HajjButton";
