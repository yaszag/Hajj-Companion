import * as React from "react";
import { HajjButton } from "./hajj-button";

export interface HajjEmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function HajjEmptyState({ emoji, title, subtitle, actionLabel, onAction }: HajjEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center animate-fade-in">
      <div className="mb-4 text-5xl" aria-hidden>
        {emoji}
      </div>
      <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      {actionLabel && onAction ? (
        <HajjButton type="button" variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </HajjButton>
      ) : null}
    </div>
  );
}
