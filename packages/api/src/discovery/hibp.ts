/**
 * Have I Been Pwned discovery. Env-gated: returns [] when HIBP_API_KEY is absent.
 * We never probe third-party services — HIBP is a consented, legitimate breach lookup.
 */
import { config } from "../config.ts";
import type { Finding } from "@forget-me/shared";

const HIBP_BASE = "https://haveibeenpwned.com/api/v3";

interface HibpBreach {
  Name: string;
  Domain?: string;
  BreachDate?: string;
  DataClasses?: string[];
}

export async function discoverHibp(email: string): Promise<Finding[]> {
  if (!config.hibpApiKey) return [];

  const res = await fetch(
    `${HIBP_BASE}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
    {
      headers: {
        "hibp-api-key": config.hibpApiKey,
        "user-agent": "forget-me",
      },
    },
  );

  if (res.status === 404) return []; // no breaches found
  if (!res.ok) {
    throw new Error(`HIBP error ${res.status}`);
  }

  const breaches = (await res.json()) as HibpBreach[];
  return breaches.map((b) => ({
    id: `hibp:${b.Name}`,
    service: b.Name,
    source: "hibp" as const,
    confidence: 0.95,
    detail: `Appeared in the ${b.Name} breach`,
    breachDate: b.BreachDate,
    dataClasses: b.DataClasses,
    guideAvailable: false,
  }));
}
