/**
 * Output formatters for `export` / `export-requests`: json, markdown, csv.
 * Pure string-producers — the commands decide where the output goes (stdout).
 */
export type ExportFormat = "json" | "markdown" | "csv";

export const EXPORT_FORMATS: ExportFormat[] = ["json", "markdown", "csv"];

export function isExportFormat(v: string): v is ExportFormat {
  return (EXPORT_FORMATS as string[]).includes(v);
}

function csvCell(value: unknown): string {
  const s = value === undefined || value === null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function mdCell(value: unknown): string {
  const s = value === undefined || value === null ? "" : String(value);
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

/** Render an array of records to the requested format using a fixed column set. */
export function formatRecords(
  records: Array<Record<string, unknown>>,
  columns: { key: string; header: string }[],
  format: ExportFormat,
): string {
  if (format === "json") {
    return JSON.stringify(records, null, 2);
  }

  if (format === "csv") {
    const head = columns.map((c) => csvCell(c.header)).join(",");
    const body = records.map((r) => columns.map((c) => csvCell(r[c.key])).join(","));
    return [head, ...body].join("\n");
  }

  // markdown
  const head = `| ${columns.map((c) => mdCell(c.header)).join(" | ")} |`;
  const sep = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = records.map(
    (r) => `| ${columns.map((c) => mdCell(r[c.key])).join(" | ")} |`,
  );
  return [head, sep, ...body].join("\n");
}
