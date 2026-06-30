import * as React from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

const tones: Record<Tone, string> = {
  default: "border-line-strong bg-surface-2 text-fg",
  accent: "border-accent/40 bg-accent/10 text-accent",
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
  danger: "border-danger/40 bg-danger/10 text-danger",
  info: "border-info/40 bg-info/10 text-info",
  muted: "border-line bg-transparent text-muted",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-none border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export type { Tone as BadgeTone };
