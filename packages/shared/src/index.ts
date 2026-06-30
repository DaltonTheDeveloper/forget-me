/**
 * @forget-me/shared — single source of truth for cross-package types & validation.
 *
 * The API, web app, and CLI all import from here so request/response shapes stay
 * in lockstep. Runtime validation uses zod; static types are inferred from the schemas.
 */
import { z } from "zod";

// ── Jurisdictions & regulations ────────────────────────────────────────────────
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
export const jurisdictionSchema = z.enum(JURISDICTIONS);
export type Jurisdiction = z.infer<typeof jurisdictionSchema>;

export const REGULATIONS = ["GDPR", "CCPA", "LGPD", "PIPEDA", "OTHER"] as const;
export const regulationSchema = z.enum(REGULATIONS);
export type Regulation = z.infer<typeof regulationSchema>;

/** Maps a jurisdiction to the regulation whose language we use. */
export const JURISDICTION_REGULATION: Record<Jurisdiction, Regulation> = {
  EU: "GDPR",
  US_CA: "CCPA",
  US_VA: "OTHER",
  US_CO: "OTHER",
  US_CT: "OTHER",
  US_UT: "OTHER",
  BR: "LGPD",
  CA: "PIPEDA",
  OTHER: "OTHER",
};

// ── Discovery ──────────────────────────────────────────────────────────────────
export const DISCOVERY_SOURCES = [
  "hibp",
  "public_search",
  "self_selection",
] as const;
export const discoverySourceSchema = z.enum(DISCOVERY_SOURCES);
export type DiscoverySource = z.infer<typeof discoverySourceSchema>;

export const DIFFICULTIES = ["easy", "medium", "hard", "impossible"] as const;
export const difficultySchema = z.enum(DIFFICULTIES);
export type Difficulty = z.infer<typeof difficultySchema>;

/** Channels we actually support. No `api_call` (fictional) or `form_submission` (impersonation). */
export const DELETION_METHODS = ["email", "user_form", "manual_only"] as const;
export const deletionMethodSchema = z.enum(DELETION_METHODS);
export type DeletionMethod = z.infer<typeof deletionMethodSchema>;

export const emailSchema = z.string().email().max(320);

export const findingSchema = z.object({
  id: z.string(),
  service: z.string(),
  source: discoverySourceSchema,
  confidence: z.number().min(0).max(1),
  detail: z.string().optional(),
  breachDate: z.string().optional(),
  dataClasses: z.array(z.string()).optional(),
  guideAvailable: z.boolean().default(false),
  guideId: z.number().int().optional(),
});
export type Finding = z.infer<typeof findingSchema>;

export const searchRequestSchema = z.object({
  email: emailSchema,
  sources: z.array(discoverySourceSchema).default(["hibp", "public_search"]),
  selectedServices: z.array(z.string()).optional(),
  maxResults: z.number().int().positive().max(200).default(50),
});
export type SearchRequest = z.infer<typeof searchRequestSchema>;

export const JOB_STATUSES = ["processing", "completed", "failed"] as const;
export const jobStatusSchema = z.enum(JOB_STATUSES);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const searchJobSchema = z.object({
  jobId: z.string(),
  email: emailSchema,
  status: jobStatusSchema,
  findings: z.array(findingSchema),
  totalFound: z.number().int(),
  log: z.array(z.string()).default([]),
  createdAt: z.string(),
});
export type SearchJob = z.infer<typeof searchJobSchema>;

// ── Guides ──────────────────────────────────────────────────────────────────────
export const guideStepSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string().url().optional(),
  warning: z.string().optional(),
  substeps: z.array(z.string()).optional(),
});
export type GuideStep = z.infer<typeof guideStepSchema>;

export const guideEmailConfigSchema = z.object({
  recipients: z.array(emailSchema).min(1),
  complianceLaws: z.array(regulationSchema).default(["GDPR", "CCPA"]),
  expectedResponseTimeDays: z.number().int().positive().default(30),
});

export const guideUserFormConfigSchema = z.object({
  url: z.string().url(),
  fields: z.record(z.string()).default({}),
});

/** Canonical guide shape used by the API and seeded from YAML. */
export const guideSchema = z.object({
  id: z.number().int().optional(),
  serviceName: z.string(),
  serviceDomain: z.string().optional(),
  website: z.string().url().optional(),
  difficulty: difficultySchema,
  estimatedTimeMinutes: z.number().int().positive().optional(),
  requiresEmailAccess: z.boolean().default(false),
  requiresPassword: z.boolean().default(false),
  steps: z.array(guideStepSchema).min(1),
  method: deletionMethodSchema,
  email: guideEmailConfigSchema.optional(),
  userForm: guideUserFormConfigSchema.optional(),
  notes: z.string().optional(),
  verifiedBy: z.string().optional(),
  verifiedDate: z.string().optional(),
  communityVerified: z.boolean().default(false),
});
export type Guide = z.infer<typeof guideSchema>;

// ── Verification & deletion requests ─────────────────────────────────────────────
export const verifyStartSchema = z.object({ email: emailSchema });
export type VerifyStart = z.infer<typeof verifyStartSchema>;

export const REQUEST_STATUSES = [
  "pending",
  "sent",
  "confirmed_receipt",
  "completed",
  "failed",
  "requires_followup",
] as const;
export const requestStatusSchema = z.enum(REQUEST_STATUSES);
export type RequestStatus = z.infer<typeof requestStatusSchema>;

export const sendRequestSchema = z.object({
  jobId: z.string(),
  email: emailSchema,
  services: z.array(z.string()).min(1),
  jurisdiction: jurisdictionSchema,
  skipManualOnly: z.boolean().default(true),
});
export type SendRequest = z.infer<typeof sendRequestSchema>;

export const deletionRequestViewSchema = z.object({
  requestId: z.string(),
  service: z.string(),
  method: deletionMethodSchema,
  status: requestStatusSchema,
  jurisdiction: jurisdictionSchema,
  regulation: regulationSchema,
  sentAt: z.string().optional(),
  expectedResponseDate: z.string().optional(),
  userFormUrl: z.string().optional(),
  errorReason: z.string().optional(),
});
export type DeletionRequestView = z.infer<typeof deletionRequestViewSchema>;

// ── Stats ─────────────────────────────────────────────────────────────────────
export const statsSchema = z.object({
  totalGuides: z.number().int(),
  verifiedGuides: z.number().int(),
  searchesCompleted: z.number().int(),
  requestsSent: z.number().int(),
});
export type Stats = z.infer<typeof statsSchema>;
