CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard', 'impossible');--> statement-breakpoint
CREATE TYPE "public"."deletion_method" AS ENUM('email', 'user_form', 'manual_only');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"github_username" varchar(255) NOT NULL,
	"guide_id" integer,
	"change_type" varchar(50) NOT NULL,
	"change_summary" text,
	"review_status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deletion_guides" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"service_domain" varchar(255),
	"website" varchar(255),
	"difficulty" "difficulty" NOT NULL,
	"estimated_time_minutes" integer,
	"requires_email_access" boolean DEFAULT false,
	"requires_password" boolean DEFAULT false,
	"steps" jsonb NOT NULL,
	"method" "deletion_method" DEFAULT 'manual_only' NOT NULL,
	"email_config" jsonb,
	"user_form_config" jsonb,
	"notes" text,
	"verified_by" varchar(255),
	"verified_date" timestamp,
	"community_verified" boolean DEFAULT false,
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "deletion_guides_service_name_unique" UNIQUE("service_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deletion_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" varchar(255) NOT NULL,
	"job_id" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"service" varchar(255) NOT NULL,
	"guide_id" integer,
	"method" "deletion_method" NOT NULL,
	"jurisdiction" varchar(50) NOT NULL,
	"regulation" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"request_body" jsonb,
	"user_form_url" varchar(1000),
	"sent_at" timestamp,
	"confirmation_email" varchar(320),
	"confirmation_date" timestamp,
	"verification_method" varchar(50) DEFAULT 'unverified',
	"verified_date" timestamp,
	"retry_count" integer DEFAULT 0,
	"next_retry_at" timestamp,
	"error_reason" text,
	"notes_from_user" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "deletion_requests_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"purpose" varchar(50) DEFAULT 'deletion_send' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "search_findings" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"service" varchar(255) NOT NULL,
	"source" varchar(50) NOT NULL,
	"confidence" integer,
	"data" jsonb,
	"guide_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"stripe_subscription_id" varchar(255),
	"stripe_price_id" varchar(255),
	"tier" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(255),
	"jurisdiction" varchar(50),
	"avatar_url" varchar(500),
	"subscription_tier" varchar(50) DEFAULT 'free',
	"subscription_status" varchar(50) DEFAULT 'active',
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"subscription_end_date" timestamp,
	"searches_remaining" integer DEFAULT 10,
	"deletion_requests_sent" integer DEFAULT 0,
	"email_notifications" boolean DEFAULT true,
	"monthly_report_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contributions" ADD CONSTRAINT "contributions_guide_id_deletion_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."deletion_guides"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_guide_id_deletion_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."deletion_guides"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "search_findings" ADD CONSTRAINT "search_findings_guide_id_deletion_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."deletion_guides"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
