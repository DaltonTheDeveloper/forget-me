/**
 * The deletion-request send pipeline. THE GATE LIVES HERE.
 *
 * No request is dispatched unless `ownerVerified` is true — i.e. the caller proved the
 * email belongs to them (verification link clicked, or signed-in Clerk-verified email).
 * Per service we pick the channel from its guide:
 *   - email       → render jurisdiction template, send via Resend
 *   - user_form   → generate a one-click packet for the user to submit themselves
 *   - manual_only → record as requires_followup (user follows the guide)
 */
import { randomUUID } from "node:crypto";
import {
  JURISDICTION_REGULATION,
  type DeletionRequestView,
  type Jurisdiction,
} from "@forget-me/shared";
import { getDb } from "../db/index.ts";
import { deletionRequests } from "../db/schema.ts";
import { getGuideByService } from "../db/guides-repo.ts";
import { renderDeletionEmail } from "./templates.ts";
import { sendEmail } from "./mailer.ts";

export class NotVerifiedError extends Error {
  constructor(email: string) {
    super(`Email ${email} is not verified. Verify ownership before sending deletion requests.`);
    this.name = "NotVerifiedError";
  }
}

export interface SendOneResult extends DeletionRequestView {
  emailDelivered?: boolean;
  emailSkipped?: boolean;
}

export async function sendDeletionRequests(params: {
  jobId: string;
  email: string;
  services: string[];
  jurisdiction: Jurisdiction;
  skipManualOnly: boolean;
  ownerVerified: boolean;
  webBaseUrl: string;
}): Promise<SendOneResult[]> {
  if (!params.ownerVerified) throw new NotVerifiedError(params.email);

  const regulation = JURISDICTION_REGULATION[params.jurisdiction];
  const date = new Date().toISOString().slice(0, 10);
  const results: SendOneResult[] = [];

  for (const service of params.services) {
    const guide = await getGuideByService(service);
    const method = (guide?.method ?? "manual_only") as "email" | "user_form" | "manual_only";
    const requestId = `req_${randomUUID()}`;

    if (method === "manual_only" && params.skipManualOnly) {
      continue;
    }

    let status: DeletionRequestView["status"] = "pending";
    let userFormUrl: string | undefined;
    let errorReason: string | undefined;
    let emailDelivered: boolean | undefined;
    let emailSkipped: boolean | undefined;
    let sentAt: Date | undefined;

    if (method === "email") {
      const cfg = guide?.emailConfig as { recipients?: string[] } | null;
      const recipients = cfg?.recipients ?? [];
      if (!recipients.length) {
        status = "failed";
        errorReason = "No privacy email on file for this service.";
      } else {
        const tpl = renderDeletionEmail({
          userEmail: params.email,
          service,
          requestId,
          date,
          jurisdiction: params.jurisdiction,
        });
        const sent = await sendEmail({
          to: recipients,
          subject: tpl.subject,
          text: tpl.body,
          replyTo: params.email,
        });
        emailDelivered = sent.delivered;
        emailSkipped = sent.skipped;
        if (sent.delivered) {
          status = "sent";
          sentAt = new Date();
        } else if (sent.skipped) {
          status = "pending"; // sending disabled locally; recorded but not delivered
          errorReason = "Sending disabled (no RESEND_API_KEY). Request recorded, not delivered.";
        } else {
          status = "failed";
          errorReason = sent.error ?? "Email delivery failed.";
        }
      }
    } else if (method === "user_form") {
      const cfg = guide?.userFormConfig as { url?: string } | null;
      if (cfg?.url) {
        userFormUrl = cfg.url;
        status = "requires_followup"; // user completes it themselves in their browser
      } else {
        status = "failed";
        errorReason = "No form URL on file for this service.";
      }
    } else {
      // manual_only, not skipped
      status = "requires_followup";
    }

    const expectedResponseDate = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

    await getDb().insert(deletionRequests).values({
      requestId,
      jobId: params.jobId,
      email: params.email,
      service,
      guideId: guide?.id ?? null,
      method,
      jurisdiction: params.jurisdiction,
      regulation,
      status,
      userFormUrl: userFormUrl ?? null,
      sentAt: sentAt ?? null,
      verificationMethod: "email_confirmation",
      errorReason: errorReason ?? null,
    });

    results.push({
      requestId,
      service,
      method,
      status,
      jurisdiction: params.jurisdiction,
      regulation,
      sentAt: sentAt?.toISOString(),
      expectedResponseDate,
      userFormUrl,
      errorReason,
      emailDelivered,
      emailSkipped,
    });
  }

  return results;
}
