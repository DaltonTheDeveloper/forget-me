/**
 * Frontend mirror of the shapes returned by the forget-me Hono API.
 * Kept local (not imported from @forget-me/shared) so the web package builds
 * standalone without transpiling raw TS from another workspace package.
 */

export const JURISDICTIONS = [
  "EU",
  "US_CA",
  "US_VA",
  "US_CO",
  "US_CT",
  "US_UT",
  "BR",
  "CA",
  "OTHER",
] as const;
export type Jurisdiction = (typeof JURISDICTIONS)[number];

export const JURISDICTION_LABELS: Record<Jurisdiction, string> = {
  EU: "European Union (GDPR)",
  US_CA: "California, US (CCPA/CPRA)",
  US_VA: "Virginia, US (VCDPA)",
  US_CO: "Colorado, US (CPA)",
  US_CT: "Connecticut, US (CTDPA)",
  US_UT: "Utah, US (UCPA)",
  BR: "Brazil (LGPD)",
  CA: "Canada (PIPEDA)",
  OTHER: "Other / Not listed",
};

export const DISCOVERY_SOURCES = ["hibp", "public_search", "self_selection"] as const;
export type DiscoverySource = (typeof DISCOVERY_SOURCES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard", "impossible"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export type DeletionMethod = "email" | "user_form" | "manual_only";

export type JobStatus = "processing" | "completed" | "failed";

export interface Finding {
  id: string;
  service: string;
  source: DiscoverySource;
  confidence: number;
  detail?: string;
  breachDate?: string;
  dataClasses?: string[];
  guideAvailable: boolean;
  guideId?: number;
}

export interface SearchJobAck {
  jobId: string;
  status: JobStatus;
  email: string;
}

export interface Findings {
  jobId: string;
  email: string;
  status: JobStatus;
  findings: Finding[];
  totalFound: number;
  log: string[];
  createdAt?: string;
}

export interface GuideStep {
  title: string;
  description: string;
  url?: string;
  warning?: string;
  substeps?: string[];
}

export interface Guide {
  id: number;
  serviceName: string;
  serviceDomain?: string;
  website?: string;
  difficulty: Difficulty;
  estimatedTimeMinutes?: number;
  requiresEmailAccess?: boolean;
  requiresPassword?: boolean;
  steps: GuideStep[];
  method: DeletionMethod;
  notes?: string;
  communityVerified?: boolean;
  emailConfig?: { recipients?: string[]; complianceLaws?: string[] } | null;
  userFormConfig?: { url?: string } | null;
}

export interface GuideListResponse {
  total: number;
  guides: Guide[];
}

export interface Stats {
  totalGuides: number;
  verifiedGuides: number;
  searchesCompleted: number;
  requestsSent: number;
}

export interface VerifyStartResponse {
  status: string;
  expiresAt: string;
  delivered: boolean;
  devConfirmUrl?: string;
}

export type RequestStatus =
  | "pending"
  | "sent"
  | "confirmed_receipt"
  | "completed"
  | "failed"
  | "requires_followup";

/** Shape returned inline by POST /api/request/send. */
export interface SentRequest {
  requestId: string;
  service: string;
  method: DeletionMethod;
  status: RequestStatus;
  userFormUrl?: string;
  errorReason?: string;
}

export interface SendResponse {
  status: string;
  jobId: string;
  requests: SentRequest[];
  summary: Record<string, number>;
}

/** Shape returned by GET /api/request/status/:jobId — raw deletion_requests rows. */
export interface TrackedRequest {
  id?: number;
  requestId: string;
  jobId: string;
  email: string;
  service: string;
  guideId?: number | null;
  method: DeletionMethod;
  jurisdiction: string;
  regulation: string;
  status: RequestStatus | string;
  userFormUrl?: string | null;
  sentAt?: string | null;
  confirmationDate?: string | null;
  verificationMethod?: string | null;
  verifiedDate?: string | null;
  retryCount?: number | null;
  errorReason?: string | null;
  notesFromUser?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TrackStatusResponse {
  jobId: string;
  requests: TrackedRequest[];
  summary: Record<string, number>;
}
