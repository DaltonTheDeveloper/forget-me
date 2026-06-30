/**
 * forget-me API — Hono server.
 *
 * Public, privacy-first endpoints for discovery, guides, email-ownership verification,
 * and verification-gated deletion sending. No endpoint ever sends a deletion request
 * for an email that hasn't been verified as owned by the requester.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { and, eq, sql } from "drizzle-orm";
import {
  searchRequestSchema,
  sendRequestSchema,
  verifyStartSchema,
  type Stats,
} from "@forget-me/shared";
import { config, features } from "./config.ts";
import { rateLimit } from "./middleware/rate-limit.ts";
import { createJob, getJob, runJob } from "./jobs.ts";
import { getDb } from "./db/index.ts";
import { deletionGuides, deletionRequests, contributions } from "./db/schema.ts";
import { getGuideById, getGuideByService, listGuides } from "./db/guides-repo.ts";
import { startVerification, confirmVerification, isEmailVerified } from "./verification/store.ts";
import { sendDeletionRequests, NotVerifiedError } from "./sending/send.ts";
import { renderDeletionEmail } from "./sending/templates.ts";
import { sendEmail } from "./sending/mailer.ts";

const app = new Hono();
app.use("*", logger());
app.use("*", cors());

app.get("/health", (c) =>
  c.json({ ok: true, features: {
    db: features.db, hibp: features.hibp, sending: features.sending,
    auth: features.auth, payments: features.payments,
  } }),
);

// ── Stats ────────────────────────────────────────────────────────────────────────
app.get("/api/stats", async (c) => {
  if (!features.db) return c.json({ totalGuides: 0, verifiedGuides: 0, searchesCompleted: 0, requestsSent: 0 } satisfies Stats);
  const db = getDb();
  const g = await db.select({ count: sql<number>`count(*)::int` }).from(deletionGuides);
  const v = await db.select({ count: sql<number>`count(*)::int` }).from(deletionGuides).where(eq(deletionGuides.communityVerified, true));
  const r = await db.select({ count: sql<number>`count(*)::int` }).from(deletionRequests).where(eq(deletionRequests.status, "sent"));
  return c.json({ totalGuides: g[0]?.count ?? 0, verifiedGuides: v[0]?.count ?? 0, searchesCompleted: 0, requestsSent: r[0]?.count ?? 0 } satisfies Stats);
});

// ── Discovery ──────────────────────────────────────────────────────────────────────
app.post("/api/search", rateLimit({ limit: 30, windowMs: 3_600_000, key: "search" }), async (c) => {
  const parsed = searchRequestSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  const job = createJob(parsed.data.email);
  // Fire-and-forget; client polls /api/findings/:jobId.
  runJob(job, parsed.data.sources, parsed.data.selectedServices ?? []);
  return c.json({ jobId: job.jobId, status: job.status, email: job.email }, 202);
});

app.get("/api/findings/:jobId", (c) => {
  const job = getJob(c.req.param("jobId"));
  if (!job) return c.json({ error: "Job not found" }, 404);
  return c.json({
    jobId: job.jobId,
    email: job.email,
    status: job.status,
    findings: job.findings,
    totalFound: job.findings.length,
    log: job.log,
    createdAt: job.createdAt,
  });
});

// ── Guides ──────────────────────────────────────────────────────────────────────
app.get("/api/guides", async (c) => {
  if (!features.db) return c.json({ total: 0, guides: [] });
  const { rows, total } = await listGuides({
    search: c.req.query("search") ?? undefined,
    difficulty: c.req.query("difficulty") ?? undefined,
    limit: Number(c.req.query("limit") ?? 50),
    offset: Number(c.req.query("offset") ?? 0),
  });
  return c.json({ total, guides: rows });
});

app.get("/api/guides/:id", async (c) => {
  if (!features.db) return c.json({ error: "Database not configured" }, 503);
  const id = c.req.param("id");
  const guide = /^\d+$/.test(id) ? await getGuideById(Number(id)) : await getGuideByService(id);
  if (!guide) return c.json({ error: "Guide not found" }, 404);
  return c.json(guide);
});

app.post("/api/guides/contribute", rateLimit({ limit: 10, windowMs: 3_600_000, key: "contribute" }), async (c) => {
  if (!features.db) return c.json({ error: "Database not configured" }, 503);
  const body = await c.req.json().catch(() => ({}));
  if (!body.service_name || !body.github_username) {
    return c.json({ error: "service_name and github_username are required" }, 400);
  }
  const [row] = await getDb().insert(contributions).values({
    githubUsername: body.github_username,
    changeType: body.action === "update" ? "update" : "create",
    changeSummary: body.change_summary ?? null,
    reviewStatus: "pending",
  }).returning();
  return c.json({ status: "submitted", contributionId: row?.id, reviewStatus: "pending" }, 201);
});

// ── Email-ownership verification (the sending gate) ────────────────────────────────
app.post("/api/verify/start", rateLimit({ limit: 10, windowMs: 3_600_000, key: "verify" }), async (c) => {
  if (!features.db) return c.json({ error: "Database not configured" }, 503);
  const parsed = verifyStartSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  const { token, expiresAt } = await startVerification(parsed.data.email);
  const confirmUrl = `${config.apiBaseUrl}/api/verify/confirm?token=${encodeURIComponent(token)}`;

  const sent = await sendEmail({
    to: [parsed.data.email],
    subject: "Confirm your forget-me deletion requests",
    text: `You're about to send account-deletion requests with forget-me.

To prove this email is yours, confirm by opening this link:
${confirmUrl}

This link expires in 24 hours. If you didn't request this, ignore this email — nothing will be sent.`,
  });

  return c.json({
    status: "verification_sent",
    expiresAt,
    delivered: sent.delivered,
    // In local/dev (no Resend), surface the link so the flow is testable.
    devConfirmUrl: sent.skipped ? confirmUrl : undefined,
  });
});

app.get("/api/verify/confirm", async (c) => {
  if (!features.db) return c.text("Database not configured", 503);
  const token = c.req.query("token");
  if (!token) return c.text("Missing token", 400);
  const email = await confirmVerification(token);
  if (!email) return c.text("This verification link is invalid or has expired.", 400);
  return c.html(`<!doctype html><html><body style="font-family:system-ui;background:#0f0f0f;color:#fafafa;display:grid;place-items:center;height:100vh;margin:0">
    <div style="text-align:center"><h1 style="color:#f59e0b">✓ Email verified</h1>
    <p>${email} is confirmed. You can return to forget-me and send your deletion requests.</p></div>
  </body></html>`);
});

// ── Deletion requests (gated) ──────────────────────────────────────────────────────
app.post("/api/request/send", rateLimit({ limit: 20, windowMs: 3_600_000, key: "send" }), async (c) => {
  if (!features.db) return c.json({ error: "Database not configured" }, 503);
  const parsed = sendRequestSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  const ownerVerified = await isEmailVerified(parsed.data.email);
  if (!ownerVerified) {
    return c.json({
      error: "email_not_verified",
      message: "Verify ownership of this email first via POST /api/verify/start.",
    }, 403);
  }

  try {
    const results = await sendDeletionRequests({
      jobId: parsed.data.jobId,
      email: parsed.data.email,
      services: parsed.data.services,
      jurisdiction: parsed.data.jurisdiction,
      skipManualOnly: parsed.data.skipManualOnly,
      ownerVerified,
      webBaseUrl: config.webBaseUrl,
    });
    const summary = {
      sent: results.filter((r) => r.status === "sent").length,
      pending: results.filter((r) => r.status === "pending").length,
      requiresFollowup: results.filter((r) => r.status === "requires_followup").length,
      failed: results.filter((r) => r.status === "failed").length,
    };
    return c.json({ status: "processed", jobId: parsed.data.jobId, requests: results, summary });
  } catch (err) {
    if (err instanceof NotVerifiedError) return c.json({ error: "email_not_verified", message: err.message }, 403);
    throw err;
  }
});

app.get("/api/request/status/:jobId", async (c) => {
  if (!features.db) return c.json({ error: "Database not configured" }, 503);
  const rows = await getDb().select().from(deletionRequests).where(eq(deletionRequests.jobId, c.req.param("jobId")));
  const summary = rows.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return c.json({ jobId: c.req.param("jobId"), requests: rows, summary });
});

app.post("/api/request/retry/:requestId", async (c) => {
  if (!features.db) return c.json({ error: "Database not configured" }, 503);
  const requestId = c.req.param("requestId");
  const [row] = await getDb().select().from(deletionRequests).where(eq(deletionRequests.requestId, requestId)).limit(1);
  if (!row) return c.json({ error: "Request not found" }, 404);
  if (row.method !== "email") return c.json({ error: "Only email requests can be retried automatically." }, 400);

  const guide = row.guideId ? await getGuideById(row.guideId) : null;
  const recipients = (guide?.emailConfig as { recipients?: string[] } | null)?.recipients ?? [];
  if (!recipients.length) return c.json({ error: "No recipients on file." }, 400);

  const tpl = renderDeletionEmail({
    userEmail: row.email,
    service: row.service,
    requestId: row.requestId,
    date: new Date().toISOString().slice(0, 10),
    jurisdiction: row.jurisdiction as never,
  });
  const sent = await sendEmail({ to: recipients, subject: tpl.subject, text: tpl.body, replyTo: row.email });
  await getDb().update(deletionRequests).set({
    status: sent.delivered ? "sent" : "failed",
    retryCount: (row.retryCount ?? 0) + 1,
    sentAt: sent.delivered ? new Date() : row.sentAt,
    errorReason: sent.delivered ? null : (sent.error ?? "retry failed"),
    updatedAt: new Date(),
  }).where(eq(deletionRequests.requestId, requestId));

  return c.json({ requestId, status: sent.delivered ? "sent" : "failed", retryCount: (row.retryCount ?? 0) + 1 });
});

app.post("/api/request/verify/:requestId", async (c) => {
  if (!features.db) return c.json({ error: "Database not configured" }, 503);
  const requestId = c.req.param("requestId");
  const body = await c.req.json().catch(() => ({}));
  const [row] = await getDb().update(deletionRequests).set({
    status: body.verified === false ? "failed" : "completed",
    verificationMethod: "user_report",
    verifiedDate: new Date(),
    notesFromUser: body.notes ?? null,
    updatedAt: new Date(),
  }).where(eq(deletionRequests.requestId, requestId)).returning();
  if (!row) return c.json({ error: "Request not found" }, 404);
  return c.json({ requestId, status: row.status, verificationMethod: "user_report" });
});

const port = config.port;
console.log(`forget-me API listening on :${port}  (features: ${JSON.stringify(features)})`);
export default { port, fetch: app.fetch };
export { app };
