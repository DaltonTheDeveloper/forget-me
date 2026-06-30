/**
 * Small presentation helpers: color, aligned tables, a dots spinner, and
 * status glyphs. Deliberately tiny — no table/spinner frameworks.
 *
 * Spinner output goes to stderr so that `--json` stdout stays machine-clean.
 */
import pc from "picocolors";

export { pc };

const ANSI_RE = /\x1b\[[0-9;]*m/g;
function visibleLength(s: string): number {
  return s.replace(ANSI_RE, "").length;
}

function pad(s: string, width: number): string {
  const len = visibleLength(s);
  return len >= width ? s : s + " ".repeat(width - len);
}

/** Render an aligned table. Header is dimmed; columns auto-size to content. */
export function table(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(visibleLength(h), ...rows.map((r) => visibleLength(r[i] ?? ""))),
  );
  const line = (cells: string[]) =>
    "  " + cells.map((c, i) => pad(c, widths[i] ?? 0)).join("   ").trimEnd();

  const out: string[] = [];
  out.push(line(headers.map((h) => pc.bold(pc.dim(h)))));
  out.push(
    "  " + widths.map((w) => pc.dim("─".repeat(w))).join("   "),
  );
  for (const r of rows) out.push(line(r));
  return out.join("\n");
}

export function heading(text: string): string {
  return pc.bold(pc.yellow(text));
}

export function dim(text: string): string {
  return pc.dim(text);
}

/** A minimal animated dots spinner that writes to stderr. */
export function spinner(label: string) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  const isTTY = Boolean(process.stderr.isTTY);

  function render() {
    if (!isTTY) return;
    const frame = frames[i % frames.length];
    i++;
    process.stderr.write(`\r${pc.yellow(frame ?? "")} ${label} `);
  }

  return {
    start() {
      if (isTTY) {
        render();
        timer = setInterval(render, 90);
      } else {
        process.stderr.write(`${label}\n`);
      }
      return this;
    },
    setLabel(next: string) {
      label = next;
    },
    stop(finalLine?: string) {
      if (timer) clearInterval(timer);
      if (isTTY) process.stderr.write("\r\x1b[2K"); // clear the line
      if (finalLine) process.stderr.write(finalLine + "\n");
    },
  };
}

/** Status -> glyph + colorizer, shared by request-status and request-send output. */
export function statusBadge(status: string): string {
  switch (status) {
    case "completed":
      return pc.green("✅ completed");
    case "sent":
      return pc.green("🟢 sent");
    case "confirmed_receipt":
      return pc.green("🟢 confirmed_receipt");
    case "pending":
      return pc.yellow("🟡 pending");
    case "requires_followup":
      return pc.magenta("🟣 requires_followup");
    case "failed":
      return pc.red("❌ failed");
    default:
      return pc.dim(`• ${status}`);
  }
}

export function confidenceText(confidence: number): string {
  const pct = Math.round((confidence ?? 0) * 100);
  if (pct >= 80) return pc.green(`${pct}%`);
  if (pct >= 50) return pc.yellow(`${pct}%`);
  return pc.red(`${pct}%`);
}

export function difficultyText(difficulty: string): string {
  switch (difficulty) {
    case "easy":
      return pc.green(difficulty);
    case "medium":
      return pc.yellow(difficulty);
    case "hard":
      return pc.red(difficulty);
    case "impossible":
      return pc.magenta(difficulty);
    default:
      return difficulty;
  }
}
