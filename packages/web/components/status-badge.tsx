import { Badge, type BadgeTone } from "@/components/ui/badge";
import { titleCase } from "@/lib/utils";
import type { Difficulty } from "@/lib/types";

const REQUEST_TONES: Record<string, BadgeTone> = {
  pending: "muted",
  sent: "info",
  confirmed_receipt: "info",
  completed: "success",
  failed: "danger",
  requires_followup: "warning",
};

export function RequestStatusBadge({ status }: { status: string }) {
  return <Badge tone={REQUEST_TONES[status] ?? "default"}>{titleCase(status)}</Badge>;
}

const DIFFICULTY_TONES: Record<Difficulty, BadgeTone> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
  impossible: "danger",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <Badge tone={DIFFICULTY_TONES[difficulty] ?? "default"}>{titleCase(difficulty)}</Badge>;
}

const SOURCE_LABELS: Record<string, string> = {
  hibp: "Breach data",
  public_search: "Public search",
  self_selection: "Self-selected",
};

export function SourceBadge({ source }: { source: string }) {
  return <Badge tone="muted">{SOURCE_LABELS[source] ?? titleCase(source)}</Badge>;
}
