/**
 * Search-job store. Jobs run asynchronously after POST /api/search; clients poll
 * GET /api/findings/:jobId. Kept in-memory (single-process) for v1; findings are also
 * persisted to search_findings when a database is configured.
 */
import { randomUUID } from "node:crypto";
import type { DiscoverySource, Finding, JobStatus } from "@forget-me/shared";
import { features } from "./config.ts";
import { getDb } from "./db/index.ts";
import { searchFindings } from "./db/schema.ts";
import { buildGuideIndex } from "./db/guides-repo.ts";
import { runDiscovery } from "./discovery/orchestrator.ts";

export interface Job {
  jobId: string;
  email: string;
  status: JobStatus;
  findings: Finding[];
  log: string[];
  createdAt: string;
}

const jobs = new Map<string, Job>();

export function getJob(jobId: string): Job | undefined {
  return jobs.get(jobId);
}

export function createJob(email: string): Job {
  const job: Job = {
    jobId: `job_${randomUUID()}`,
    email,
    status: "processing",
    findings: [],
    log: [],
    createdAt: new Date().toISOString(),
  };
  jobs.set(job.jobId, job);
  return job;
}

export async function runJob(
  job: Job,
  sources: DiscoverySource[],
  selectedServices: string[],
): Promise<void> {
  try {
    const guideIndex = features.db ? await buildGuideIndex() : new Map<string, number>();
    const { findings, log } = await runDiscovery(job.email, sources, selectedServices, guideIndex);
    job.findings = findings;
    job.log = log;
    job.status = "completed";

    if (features.db && findings.length) {
      await getDb().insert(searchFindings).values(
        findings.map((f) => ({
          jobId: job.jobId,
          email: job.email,
          service: f.service,
          source: f.source,
          confidence: Math.round(f.confidence * 100),
          data: f,
          guideId: f.guideId ?? null,
        })),
      );
    }
  } catch (err: any) {
    job.status = "failed";
    job.log.push(`Discovery failed: ${err?.message ?? err}`);
  }
}
