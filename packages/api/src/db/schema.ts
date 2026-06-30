/**
 * Drizzle schema for forget-me.
 *
 * Diverges from the original spec where safety required it:
 *  - deletion_requests.method ∈ {email, user_form, manual_only} (no fictional api_call).
 *  - email_verifications table gates all sending on proven ownership.
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard", "impossible"]);
export const methodEnum = pgEnum("deletion_method", ["email", "user_form", "manual_only"]);

// ── Guides ──────────────────────────────────────────────────────────────────────
export const deletionGuides = pgTable("deletion_guides", {
  id: serial("id").primaryKey(),
  serviceName: varchar("service_name", { length: 255 }).notNull().unique(),
  serviceDomain: varchar("service_domain", { length: 255 }),
  website: varchar("website", { length: 255 }),
  difficulty: difficultyEnum("difficulty").notNull(),
  estimatedTimeMinutes: integer("estimated_time_minutes"),
  requiresEmailAccess: boolean("requires_email_access").default(false),
  requiresPassword: boolean("requires_password").default(false),
  steps: jsonb("steps").notNull(),
  method: methodEnum("method").notNull().default("manual_only"),
  emailConfig: jsonb("email_config"),
  userFormConfig: jsonb("user_form_config"),
  notes: text("notes"),
  verifiedBy: varchar("verified_by", { length: 255 }),
  verifiedDate: timestamp("verified_date"),
  communityVerified: boolean("community_verified").default(false),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Discovery findings ───────────────────────────────────────────────────────────
export const searchFindings = pgTable("search_findings", {
  id: serial("id").primaryKey(),
  jobId: varchar("job_id", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  service: varchar("service", { length: 255 }).notNull(),
  source: varchar("source", { length: 50 }).notNull(),
  confidence: integer("confidence"), // 0-100
  data: jsonb("data"),
  guideId: integer("guide_id").references(() => deletionGuides.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Email ownership verification (the sending gate) ──────────────────────────────
export const emailVerifications = pgTable("email_verifications", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull().default("deletion_send"),
  expiresAt: timestamp("expires_at").notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Deletion requests ────────────────────────────────────────────────────────────
export const deletionRequests = pgTable("deletion_requests", {
  id: serial("id").primaryKey(),
  requestId: varchar("request_id", { length: 255 }).notNull().unique(),
  jobId: varchar("job_id", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  service: varchar("service", { length: 255 }).notNull(),
  guideId: integer("guide_id").references(() => deletionGuides.id),
  method: methodEnum("method").notNull(),
  jurisdiction: varchar("jurisdiction", { length: 50 }).notNull(),
  regulation: varchar("regulation", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  requestBody: jsonb("request_body"),
  userFormUrl: varchar("user_form_url", { length: 1000 }),
  sentAt: timestamp("sent_at"),
  confirmationEmail: varchar("confirmation_email", { length: 320 }),
  confirmationDate: timestamp("confirmation_date"),
  verificationMethod: varchar("verification_method", { length: 50 }).default("unverified"),
  verifiedDate: timestamp("verified_date"),
  retryCount: integer("retry_count").default(0),
  nextRetryAt: timestamp("next_retry_at"),
  errorReason: text("error_reason"),
  notesFromUser: text("notes_from_user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Contributions ────────────────────────────────────────────────────────────────
export const contributions = pgTable("contributions", {
  id: serial("id").primaryKey(),
  githubUsername: varchar("github_username", { length: 255 }).notNull(),
  guideId: integer("guide_id").references(() => deletionGuides.id),
  changeType: varchar("change_type", { length: 50 }).notNull(),
  changeSummary: text("change_summary"),
  reviewStatus: varchar("review_status", { length: 50 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Users / subscriptions (env-gated auth + payments) ────────────────────────────
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk user id
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  jurisdiction: varchar("jurisdiction", { length: 50 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  subscriptionTier: varchar("subscription_tier", { length: 50 }).default("free"),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("active"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  subscriptionEndDate: timestamp("subscription_end_date"),
  searchesRemaining: integer("searches_remaining").default(10),
  deletionRequestsSent: integer("deletion_requests_sent").default(0),
  emailNotifications: boolean("email_notifications").default(true),
  monthlyReportEnabled: boolean("monthly_report_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  tier: varchar("tier", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Relations ────────────────────────────────────────────────────────────────────
export const deletionGuidesRelations = relations(deletionGuides, ({ many }) => ({
  findings: many(searchFindings),
  requests: many(deletionRequests),
}));

export const searchFindingsRelations = relations(searchFindings, ({ one }) => ({
  guide: one(deletionGuides, {
    fields: [searchFindings.guideId],
    references: [deletionGuides.id],
  }),
}));

export const deletionRequestsRelations = relations(deletionRequests, ({ one }) => ({
  guide: one(deletionGuides, {
    fields: [deletionRequests.guideId],
    references: [deletionGuides.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));
