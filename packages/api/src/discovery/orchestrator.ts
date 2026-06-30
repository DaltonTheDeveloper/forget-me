/**
 * Runs the discovery sources in parallel with a per-source timeout, merges and
 * de-duplicates findings, and tags each with whether a deletion guide exists.
 *
 * Sources, by design (see design spec §2): HIBP (consented breach lookup),
 * public GitHub search, and user self-selection from the guide catalog.
 * There is deliberately NO account-enumeration / password-reset probing.
 */
import type { DiscoverySource, Finding } from "@forget-me/shared";
import { discoverHibp } from "./hibp.ts";
import { discoverPublicSearch } from "./public-search.ts";

const SOURCE_TIMEOUT_MS = 12_000;

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T, label: string, log: string[]): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      log.push(`${label}: timed out after ${ms}ms`);
      resolve(fallback);
    }, ms);
    p.then((v) => {
      clearTimeout(timer);
      resolve(v);
    }).catch((err) => {
      clearTimeout(timer);
      log.push(`${label}: ${err.message ?? err}`);
      resolve(fallback);
    });
  });
}

export interface DiscoveryResult {
  findings: Finding[];
  log: string[];
}

/**
 * @param email          email to investigate
 * @param sources        which automated sources to run
 * @param selected       services the user self-declared they have accounts with
 * @param guideIndex     map of lowercased service name -> guide id, to flag guide availability
 */
export async function runDiscovery(
  email: string,
  sources: DiscoverySource[],
  selected: string[] = [],
  guideIndex: Map<string, number> = new Map(),
): Promise<DiscoveryResult> {
  const log: string[] = [];
  const tasks: Promise<Finding[]>[] = [];

  if (sources.includes("hibp")) {
    tasks.push(withTimeout(discoverHibp(email), SOURCE_TIMEOUT_MS, [], "hibp", log));
  }
  if (sources.includes("public_search")) {
    tasks.push(withTimeout(discoverPublicSearch(email), SOURCE_TIMEOUT_MS, [], "public_search", log));
  }

  const automated = (await Promise.all(tasks)).flat();

  // Self-selected services are user-declared, max confidence, no probing involved.
  const selfSelected: Finding[] = selected.map((service) => ({
    id: `self_selection:${service}`,
    service,
    source: "self_selection" as const,
    confidence: 1,
    detail: "You indicated you have an account here",
    guideAvailable: false,
  }));

  // Merge + dedupe by lowercased service name (first wins; ordered by confidence).
  const all = [...selfSelected, ...automated].sort((a, b) => b.confidence - a.confidence);
  const byService = new Map<string, Finding>();
  for (const f of all) {
    const key = f.service.toLowerCase();
    if (!byService.has(key)) byService.set(key, f);
  }

  // Flag guide availability.
  const findings = [...byService.values()].map((f) => {
    const guideId = guideIndex.get(f.service.toLowerCase());
    return guideId ? { ...f, guideAvailable: true, guideId } : f;
  });

  log.push(`Discovered ${findings.length} unique service(s) from ${sources.join(", ") || "self-selection"}.`);
  return { findings, log };
}
