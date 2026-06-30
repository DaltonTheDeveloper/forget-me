/**
 * Deletion-request lifecycle commands:
 *   request-send, request-status, request-retry, request-verify.
 */
import type { Command } from "commander";
import { JURISDICTIONS, type Jurisdiction } from "@forget-me/shared";
import {
  api,
  ApiError,
  type FindingsResponse,
  type RequestResult,
  type RequestSendResponse,
  type RequestStatusResponse,
  type RetryResponse,
  type VerifyRequestResponse,
} from "../api.ts";
import { pc, dim, heading, statusBadge } from "../ui.ts";

function splitCsv(v?: string): string[] | undefined {
  if (!v) return undefined;
  const parts = v.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}

function renderResult(r: RequestResult) {
  console.log(`  ${statusBadge(r.status)}  ${pc.bold(r.service)} ${dim(`(${r.method})`)}`);
  if (r.userFormUrl) {
    console.log(`     ${pc.cyan("Complete in your browser:")} ${pc.underline(r.userFormUrl)}`);
  }
  if (r.errorReason) {
    console.log(`     ${pc.red("reason:")} ${r.errorReason}`);
  }
  if (r.requestId) {
    console.log(`     ${dim("request id:")} ${dim(r.requestId)}`);
  }
}

function renderSummary(summary: Record<string, number>) {
  const parts = Object.entries(summary)
    .filter(([, n]) => n)
    .map(([k, n]) => `${k}: ${pc.bold(String(n))}`);
  if (parts.length) {
    console.log();
    console.log(`  ${dim("Summary —")} ${parts.join("   ")}`);
  }
}

export function registerRequestSend(program: Command) {
  program
    .command("request-send")
    .description("Send deletion requests for a job (requires a verified email)")
    .argument("<jobId>", "job id from a prior search")
    .requiredOption("--email <email>", "your verified email address")
    .option("--jurisdiction <code>", `jurisdiction (${JURISDICTIONS.join(",")})`, "EU")
    .option("--services <list>", "comma list of services (defaults to all findings)")
    .option("--skip-manual", "skip manual-only services", false)
    .option("--json", "output raw JSON")
    .action(
      async (
        jobId: string,
        opts: { email: string; jurisdiction: string; services?: string; skipManual?: boolean; json?: boolean },
      ) => {
        if (!(JURISDICTIONS as readonly string[]).includes(opts.jurisdiction)) {
          console.error(pc.red(`  Invalid --jurisdiction "${opts.jurisdiction}". Valid: ${JURISDICTIONS.join(", ")}`));
          process.exitCode = 1;
          return;
        }

        let services = splitCsv(opts.services);
        if (!services) {
          // Default to every service discovered for this job.
          const findings = await api.get<FindingsResponse>(`/api/findings/${encodeURIComponent(jobId)}`);
          services = [...new Set(findings.findings.map((f) => f.service))];
          if (!services.length) {
            console.error(pc.red("  No services found for this job. Pass --services <a,b> explicitly."));
            process.exitCode = 1;
            return;
          }
        }

        try {
          const res = await api.post<RequestSendResponse>("/api/request/send", {
            jobId,
            email: opts.email,
            services,
            jurisdiction: opts.jurisdiction as Jurisdiction,
            skipManualOnly: Boolean(opts.skipManual),
          });

          if (opts.json) {
            console.log(JSON.stringify(res, null, 2));
            return;
          }

          console.log();
          console.log(heading(`  Deletion requests for job ${jobId}`));
          console.log();
          for (const r of res.requests) renderResult(r);
          renderSummary(res.summary);
          console.log();
          console.log(`  ${dim("Track progress:")} ${pc.bold(`forget-me request-status ${jobId}`)}`);
          console.log();
        } catch (err) {
          if (err instanceof ApiError && err.status === 403) {
            const body = err.body as { error?: string } | undefined;
            if (body?.error === "email_not_verified") {
              console.error();
              console.error(pc.red("  ✗ This email is not verified — nothing was sent."));
              console.error(`  ${dim("Verify ownership first:")} ${pc.bold(`forget-me verify ${opts.email}`)}`);
              console.error(dim("  Then open the confirmation link and re-run this command."));
              console.error();
              process.exitCode = 1;
              return;
            }
          }
          throw err;
        }
      },
    );
}

export function registerRequestStatus(program: Command) {
  program
    .command("request-status")
    .description("Show grouped deletion-request status for a job")
    .argument("<jobId>", "job id")
    .option("--json", "output raw JSON")
    .action(async (jobId: string, opts: { json?: boolean }) => {
      const res = await api.get<RequestStatusResponse>(`/api/request/status/${encodeURIComponent(jobId)}`);

      if (opts.json) {
        console.log(JSON.stringify(res, null, 2));
        return;
      }

      console.log();
      console.log(heading(`  Status for job ${jobId}`));
      console.log();

      if (!res.requests.length) {
        console.log(dim("  No deletion requests for this job yet."));
        console.log(`  ${dim("Start one:")} ${pc.bold(`forget-me request-send ${jobId} --email you@example.com`)}`);
        console.log();
        return;
      }

      // Group by status, preserving a friendly order.
      const order = ["completed", "sent", "confirmed_receipt", "pending", "requires_followup", "failed"];
      const groups = new Map<string, RequestResult[]>();
      for (const r of res.requests) {
        const list = groups.get(r.status) ?? [];
        list.push(r);
        groups.set(r.status, list);
      }
      const seen = new Set<string>();
      const keys = [...order.filter((k) => groups.has(k)), ...[...groups.keys()].filter((k) => !order.includes(k))];

      for (const status of keys) {
        if (seen.has(status)) continue;
        seen.add(status);
        const list = groups.get(status) ?? [];
        console.log(`  ${statusBadge(status)} ${dim(`(${list.length})`)}`);
        for (const r of list) {
          console.log(`     ${pc.bold(r.service)} ${dim(`(${r.method})`)}${r.errorReason ? pc.red(`  — ${r.errorReason}`) : ""}`);
          if (r.userFormUrl) console.log(`       ${pc.cyan("→")} ${pc.underline(r.userFormUrl)}`);
        }
        console.log();
      }
    });
}

export function registerRequestRetry(program: Command) {
  program
    .command("request-retry")
    .description("Retry a failed email deletion request")
    .argument("<requestId>", "request id to retry")
    .action(async (requestId: string) => {
      const res = await api.post<RetryResponse>(`/api/request/retry/${encodeURIComponent(requestId)}`);
      console.log();
      console.log(`  ${statusBadge(res.status)}  ${dim("request")} ${requestId}`);
      if (typeof res.retryCount === "number") console.log(`  ${dim("retry count:")} ${res.retryCount}`);
      console.log();
    });
}

export function registerRequestVerify(program: Command) {
  program
    .command("request-verify")
    .description("Mark a deletion request as verified/completed")
    .argument("<requestId>", "request id to mark verified")
    .option("--notes <text>", "optional notes about how you confirmed it")
    .action(async (requestId: string, opts: { notes?: string }) => {
      const res = await api.post<VerifyRequestResponse>(`/api/request/verify/${encodeURIComponent(requestId)}`, {
        verified: true,
        ...(opts.notes ? { notes: opts.notes } : {}),
      });
      console.log();
      console.log(`  ${statusBadge(res.status)}  ${dim("request")} ${requestId}`);
      console.log();
    });
}
