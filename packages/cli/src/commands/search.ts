/**
 * `search` — discover where an email is registered.
 * `track`  — convenience: kick off a search and print the jobId to track.
 */
import type { Command } from "commander";
import { api, type FindingsResponse, type SearchResponse } from "../api.ts";
import { pc, table, spinner, confidenceText, heading, dim } from "../ui.ts";

function splitCsv(v?: string): string[] | undefined {
  if (!v) return undefined;
  const parts = v.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}

async function pollFindings(jobId: string, onTick?: (f: FindingsResponse) => void): Promise<FindingsResponse> {
  const maxAttempts = 90; // ~72s at 800ms
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const findings = await api.get<FindingsResponse>(`/api/findings/${encodeURIComponent(jobId)}`);
    onTick?.(findings);
    if (findings.status !== "processing") return findings;
    await new Promise((r) => setTimeout(r, 800));
  }
  // Return whatever we have; caller renders the (possibly still-processing) state.
  return api.get<FindingsResponse>(`/api/findings/${encodeURIComponent(jobId)}`);
}

function renderFindings(result: FindingsResponse) {
  console.log();
  if (!result.findings.length) {
    console.log(dim("  No registrations found for this email."));
  } else {
    const rows = result.findings.map((f) => [
      pc.bold(f.service),
      f.source,
      confidenceText(f.confidence),
      f.guideAvailable ? pc.green("yes") : dim("no"),
      f.detail ? dim(f.detail) : "",
    ]);
    console.log(table(["Service", "Source", "Confidence", "Guide", "Detail"], rows));
  }
  console.log();
  console.log(`  ${dim("Found:")} ${pc.bold(String(result.totalFound))}   ${dim("Job ID:")} ${pc.cyan(result.jobId)}`);
  console.log();
  console.log(`  ${dim("Run:")} ${pc.bold(`forget-me request-send ${result.jobId} --email ${result.email} --jurisdiction EU`)}`);
}

export function registerSearch(program: Command) {
  program
    .command("search")
    .description("Discover where an email is registered")
    .argument("<email>", "email address to search for")
    .option("--sources <list>", "comma list of sources (hibp,public_search,self_selection)")
    .option("--select <list>", "comma list of services to self-select (github,notion,...)")
    .option("--json", "output raw JSON")
    .action(async (email: string, opts: { sources?: string; select?: string; json?: boolean }) => {
      const sources = splitCsv(opts.sources);
      const selectedServices = splitCsv(opts.select);

      const start = await api.post<SearchResponse>("/api/search", {
        email,
        ...(sources ? { sources } : {}),
        ...(selectedServices ? { selectedServices } : {}),
      });

      if (opts.json) {
        const result = await pollFindings(start.jobId);
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      const spin = spinner(`Searching for ${pc.bold(email)}…`).start();
      const result = await pollFindings(start.jobId, (f) => {
        if (f.totalFound) spin.setLabel(`Searching for ${pc.bold(email)}… ${dim(`(${f.totalFound} found)`)}`);
      });
      spin.stop(
        result.status === "completed"
          ? pc.green(`✓ Search complete for ${email}`)
          : result.status === "failed"
            ? pc.red(`✗ Search failed for ${email}`)
            : pc.yellow(`… Search still processing for ${email}`),
      );
      renderFindings(result);
    });
}

export function registerTrack(program: Command) {
  program
    .command("track")
    .description("Start a search and print the Job ID you can track later")
    .argument("<email>", "email address to track")
    .action(async (email: string) => {
      const start = await api.post<SearchResponse>("/api/search", { email });
      console.log();
      console.log(heading("  Tracking started"));
      console.log(`  ${dim("Email:")}  ${email}`);
      console.log(`  ${dim("Job ID:")} ${pc.cyan(start.jobId)}`);
      console.log();
      console.log(dim("  Watch findings come in:"));
      console.log(`    ${pc.bold(`forget-me search ${email}`)}`);
      console.log(dim("  Check deletion-request status for this job:"));
      console.log(`    ${pc.bold(`forget-me request-status ${start.jobId}`)}`);
      console.log();
    });
}
