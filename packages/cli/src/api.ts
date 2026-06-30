/**
 * Tiny HTTP client over the forget-me API.
 *
 * Two error types let commands tell apart "the server is down" from
 * "the server said no": ApiConnectionError vs ApiError. Neither ever
 * leaks a raw stack trace to the user (see index.ts run wrapper).
 */
import { getApiBaseUrl } from "./config.ts";

/** The API could not be reached at all (DNS, refused connection, timeout). */
export class ApiConnectionError extends Error {
  constructor(public readonly baseUrl: string, cause?: unknown) {
    super(`Could not reach the forget-me API at ${baseUrl}`);
    this.name = "ApiConnectionError";
    if (cause) (this as { cause?: unknown }).cause = cause;
  }
}

/** The API responded with a non-2xx status. `body` holds the parsed payload. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `API request failed with status ${status}`);
    this.name = "ApiError";
  }
}

type Method = "GET" | "POST";

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.message === "string") return b.message;
    if (typeof b.error === "string") return b.error;
  }
  return fallback;
}

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body !== undefined ? { "content-type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiConnectionError(baseUrl, err);
  }

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, data, extractMessage(data, `Request failed (HTTP ${res.status})`));
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
};

// ── Response shapes (mirrors the API; kept loose where the API returns DB rows) ──

export interface SearchResponse {
  jobId: string;
  status: string;
  email: string;
}

export interface Finding {
  id?: string;
  service: string;
  source: string;
  confidence: number;
  detail?: string;
  guideAvailable?: boolean;
  guideId?: number;
}

export interface FindingsResponse {
  jobId: string;
  email: string;
  status: "processing" | "completed" | "failed" | string;
  findings: Finding[];
  totalFound: number;
  log: string[];
  createdAt?: string;
}

export interface GuideListItem {
  id: number;
  serviceName: string;
  difficulty: string;
  estimatedTimeMinutes?: number | null;
  communityVerified?: boolean | null;
  method: string;
}

export interface GuidesResponse {
  total: number;
  guides: GuideListItem[];
}

export interface GuideStep {
  title: string;
  description: string;
  url?: string;
  warning?: string;
  substeps?: string[];
}

export interface GuideDetail {
  id?: number;
  serviceName: string;
  serviceDomain?: string;
  website?: string;
  difficulty: string;
  estimatedTimeMinutes?: number | null;
  requiresEmailAccess?: boolean;
  requiresPassword?: boolean;
  method: string;
  steps: GuideStep[];
  notes?: string;
  communityVerified?: boolean;
  // The API may return DB-row column names too; keep it permissive.
  [key: string]: unknown;
}

export interface VerifyStartResponse {
  status: string;
  expiresAt?: string;
  delivered?: boolean;
  devConfirmUrl?: string;
}

export interface RequestResult {
  requestId: string;
  service: string;
  method: string;
  status: string;
  sentAt?: string;
  userFormUrl?: string;
  errorReason?: string;
}

export interface RequestSendResponse {
  status?: string;
  jobId?: string;
  requests: RequestResult[];
  summary: Record<string, number>;
}

export interface RequestStatusResponse {
  jobId?: string;
  requests: RequestResult[];
  summary: Record<string, number>;
}

export interface RetryResponse {
  requestId: string;
  status: string;
  retryCount?: number;
}

export interface VerifyRequestResponse {
  requestId: string;
  status: string;
  verificationMethod?: string;
}
