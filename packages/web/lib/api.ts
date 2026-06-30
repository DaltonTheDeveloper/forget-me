/**
 * Typed, failure-tolerant client for the forget-me Hono API.
 *
 * Every call returns either parsed data or `null` (never throws to the page) so
 * UI can render graceful empty/offline states when the API is down or unset.
 * For mutations where the caller needs the error body (e.g. the 403
 * `email_not_verified` gate), use the `*Raw` helpers that return a result union.
 */
import type {
  Findings,
  Guide,
  GuideListResponse,
  SearchJobAck,
  SendResponse,
  Stats,
  TrackStatusResponse,
  VerifyStartResponse,
  DiscoverySource,
  Jurisdiction,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:3001";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; body?: unknown };

async function request<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<ApiResult<T>> {
  const { timeoutMs = 15000, ...rest } = init ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(rest.headers ?? {}),
      },
      cache: "no-store",
    });
    const text = await res.text();
    let body: unknown = undefined;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    if (!res.ok) {
      const error =
        (body && typeof body === "object" && "error" in body && String((body as any).error)) ||
        `HTTP ${res.status}`;
      return { ok: false, status: res.status, error, body };
    }
    return { ok: true, data: body as T };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "network_error",
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Returns data or null — for read paths that should silently degrade. */
async function getOrNull<T>(path: string): Promise<T | null> {
  const r = await request<T>(path);
  return r.ok ? r.data : null;
}

// ── Stats ────────────────────────────────────────────────────────────────────
export const getStats = () => getOrNull<Stats>("/api/stats");

// ── Discovery ──────────────────────────────────────────────────────────────────
export function startSearch(input: {
  email: string;
  sources?: DiscoverySource[];
  selectedServices?: string[];
}): Promise<ApiResult<SearchJobAck>> {
  return request<SearchJobAck>("/api/search", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export const getFindings = (jobId: string) =>
  getOrNull<Findings>(`/api/findings/${encodeURIComponent(jobId)}`);

// ── Guides ──────────────────────────────────────────────────────────────────────
export function listGuides(params: {
  search?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<GuideListResponse | null> {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.difficulty) q.set("difficulty", params.difficulty);
  if (params.limit != null) q.set("limit", String(params.limit));
  if (params.offset != null) q.set("offset", String(params.offset));
  const qs = q.toString();
  return getOrNull<GuideListResponse>(`/api/guides${qs ? `?${qs}` : ""}`);
}

export const getGuide = (id: string) =>
  getOrNull<Guide>(`/api/guides/${encodeURIComponent(id)}`);

// ── Verification ──────────────────────────────────────────────────────────────
export function startVerification(email: string): Promise<ApiResult<VerifyStartResponse>> {
  return request<VerifyStartResponse>("/api/verify/start", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// ── Deletion requests ────────────────────────────────────────────────────────
export function sendRequests(input: {
  jobId: string;
  email: string;
  services: string[];
  jurisdiction: Jurisdiction;
  skipManualOnly?: boolean;
}): Promise<ApiResult<SendResponse>> {
  return request<SendResponse>("/api/request/send", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export const getRequestStatus = (jobId: string) =>
  getOrNull<TrackStatusResponse>(`/api/request/status/${encodeURIComponent(jobId)}`);

export function retryRequest(requestId: string): Promise<ApiResult<unknown>> {
  return request(`/api/request/retry/${encodeURIComponent(requestId)}`, { method: "POST" });
}

export function markRequestVerified(
  requestId: string,
  verified: boolean,
  notes?: string,
): Promise<ApiResult<unknown>> {
  return request(`/api/request/verify/${encodeURIComponent(requestId)}`, {
    method: "POST",
    body: JSON.stringify({ verified, notes }),
  });
}
