/**
 * `export`          — export findings for a job as json/markdown/csv.
 * `export-requests` — export deletion-request status for a job.
 */
import type { Command } from "commander";
import { api, type FindingsResponse, type RequestStatusResponse } from "../api.ts";
import { formatRecords, isExportFormat, type ExportFormat } from "../format.ts";
import { pc } from "../ui.ts";

function resolveFormat(raw: string | undefined): ExportFormat {
  const fmt = (raw ?? "json").toLowerCase();
  if (!isExportFormat(fmt)) {
    console.error(pc.red(`  Invalid --format "${raw}". Use one of: json, markdown, csv`));
    process.exit(1);
  }
  return fmt;
}

export function registerExport(program: Command) {
  program
    .command("export")
    .description("Export a job's findings (json|markdown|csv) to stdout")
    .argument("<jobId>", "job id")
    .option("--format <fmt>", "json | markdown | csv", "json")
    .action(async (jobId: string, opts: { format?: string }) => {
      const format = resolveFormat(opts.format);
      const res = await api.get<FindingsResponse>(`/api/findings/${encodeURIComponent(jobId)}`);
      const records = res.findings.map((f) => ({
        service: f.service,
        source: f.source,
        confidence: f.confidence,
        guideAvailable: f.guideAvailable ?? false,
        detail: f.detail ?? "",
      }));
      const out = formatRecords(records, [
        { key: "service", header: "Service" },
        { key: "source", header: "Source" },
        { key: "confidence", header: "Confidence" },
        { key: "guideAvailable", header: "Guide" },
        { key: "detail", header: "Detail" },
      ], format);
      console.log(out);
    });
}

export function registerExportRequests(program: Command) {
  program
    .command("export-requests")
    .description("Export a job's deletion-request status (json|markdown|csv) to stdout")
    .argument("<jobId>", "job id")
    .option("--format <fmt>", "json | markdown | csv", "json")
    .action(async (jobId: string, opts: { format?: string }) => {
      const format = resolveFormat(opts.format);
      const res = await api.get<RequestStatusResponse>(`/api/request/status/${encodeURIComponent(jobId)}`);
      const records = res.requests.map((r) => ({
        requestId: r.requestId,
        service: r.service,
        method: r.method,
        status: r.status,
        sentAt: r.sentAt ?? "",
        errorReason: r.errorReason ?? "",
      }));
      const out = formatRecords(records, [
        { key: "requestId", header: "Request ID" },
        { key: "service", header: "Service" },
        { key: "method", header: "Method" },
        { key: "status", header: "Status" },
        { key: "sentAt", header: "Sent At" },
        { key: "errorReason", header: "Error" },
      ], format);
      console.log(out);
    });
}
