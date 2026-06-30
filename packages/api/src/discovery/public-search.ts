/**
 * Public-source discovery via the GitHub commit search API. This finds emails that the
 * user (or others) made public in commit metadata — a legitimate public signal, not a probe.
 * Works unauthenticated at a low rate limit; GITHUB_TOKEN raises it.
 */
import { config } from "../config.ts";
import type { Finding } from "@forget-me/shared";

export async function discoverPublicSearch(email: string): Promise<Finding[]> {
  const headers: Record<string, string> = {
    accept: "application/vnd.github.cloak-preview+json",
    "user-agent": "forget-me",
  };
  if (config.githubToken) headers.authorization = `Bearer ${config.githubToken}`;

  const res = await fetch(
    `https://api.github.com/search/commits?q=author-email:${encodeURIComponent(email)}&per_page=1`,
    { headers },
  );

  if (res.status === 403 || res.status === 422) return []; // rate-limited or unprocessable → skip
  if (!res.ok) return [];

  const data = (await res.json()) as { total_count?: number };
  if (!data.total_count || data.total_count === 0) return [];

  return [
    {
      id: "public_search:github",
      service: "GitHub",
      source: "public_search",
      confidence: 0.6,
      detail: `Email appears in ${data.total_count} public commit(s) on GitHub`,
      guideAvailable: false,
    },
  ];
}
