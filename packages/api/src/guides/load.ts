/**
 * Load + validate YAML deletion guides from the repo `guides/` directory.
 * The YAML uses snake_case on disk (friendly for contributors); we map it to the
 * camelCase `Guide` shape from @forget-me/shared and validate with zod.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { guideSchema, type Guide } from "@forget-me/shared";

export const GUIDES_DIR = new URL("../../../../guides", import.meta.url).pathname;

/** Convert one parsed YAML object into a validated Guide. Throws on invalid input. */
export function normalizeGuide(raw: any, sourceName: string): Guide {
  const svc = raw?.service ?? {};
  const del = raw?.deletion ?? {};
  const req = raw?.deletion_request ?? {};
  const meta = raw?.metadata ?? {};

  const candidate = {
    serviceName: svc.name,
    serviceDomain: svc.domain,
    website: svc.website,
    difficulty: del.difficulty,
    estimatedTimeMinutes: del.estimated_time_minutes,
    requiresEmailAccess: del.requires_email_access ?? false,
    requiresPassword: del.requires_password ?? false,
    steps: (raw?.steps ?? []).map((s: any) => ({
      title: s.title,
      description: s.description,
      url: s.url,
      warning: s.warning,
      substeps: s.substeps,
    })),
    method: req.method ?? "manual_only",
    email: req.email
      ? {
          recipients: req.email.recipients ?? [],
          complianceLaws: req.email.compliance_laws ?? ["GDPR", "CCPA"],
          expectedResponseTimeDays: req.email.expected_response_time_days ?? 30,
        }
      : undefined,
    userForm: req.user_form
      ? { url: req.user_form.url, fields: req.user_form.fields ?? {} }
      : undefined,
    notes: meta.notes,
    verifiedBy: meta.verified_by,
    verifiedDate: meta.verified_date ? String(meta.verified_date) : undefined,
    communityVerified: meta.community_verified ?? false,
  };

  const result = guideSchema.safeParse(candidate);
  if (!result.success) {
    throw new Error(`Invalid guide "${sourceName}": ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
  // Enforce the safety invariant: an `email` method must declare recipients.
  if (result.data.method === "email" && !result.data.email?.recipients.length) {
    throw new Error(`Guide "${sourceName}" uses method:email but declares no recipients.`);
  }
  if (result.data.method === "user_form" && !result.data.userForm?.url) {
    throw new Error(`Guide "${sourceName}" uses method:user_form but declares no form url.`);
  }
  return result.data;
}

/** Read and validate every guide in the guides directory. */
export function loadAllGuides(): Guide[] {
  const files = readdirSync(GUIDES_DIR).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  return files.map((file) => {
    const raw = parse(readFileSync(join(GUIDES_DIR, file), "utf8"));
    return normalizeGuide(raw, file);
  });
}
