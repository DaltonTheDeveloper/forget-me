import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStats } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    title: "Discover",
    body: "Find services tied to your email via breach data, public sources, and a community catalog of 500+ services. No account probing, ever.",
    icon: (
      <path d="M11 11l4 4m-2-7a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z" />
    ),
  },
  {
    title: "Auto-send",
    body: "We email legally-worded GDPR/CCPA deletion requests to each service's privacy contact — in the right language for your jurisdiction.",
    icon: <path d="M2 5l8 6 8-6M2 5h16v10H2V5Z" />,
  },
  {
    title: "Track",
    body: "Watch responses arrive, retry failures, and follow each request through to confirmed deletion on one timeline.",
    icon: <path d="M3 10h3l2-5 4 10 2-5h3" />,
  },
  {
    title: "Proof",
    body: "Every request is logged with a request ID and timestamp, so you have an exportable record of exactly what you asked, and when.",
    icon: <path d="M5 3h7l3 3v11H5V3Zm2 8l2 2 4-4" />,
  },
];

const TRUST = [
  {
    title: "We never store passwords",
    body: "forget-me never asks for, stores, or transmits your passwords or 2FA codes. There is nothing to leak.",
  },
  {
    title: "We never access your accounts",
    body: "No logins, no headless browsers impersonating you. For web-only forms we hand you a one-click link you submit yourself.",
  },
  {
    title: "Verification-gated by design",
    body: "No deletion request is ever sent for an email until you prove you own it with a one-click confirmation link.",
  },
];

export default async function HomePage() {
  const stats = await getStats();

  const statItems = [
    { label: "Deletion guides", value: stats?.totalGuides },
    { label: "Community-verified", value: stats?.verifiedGuides },
    { label: "Searches run", value: stats?.searchesCompleted },
    { label: "Requests sent", value: stats?.requestsSent },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line grid-bg">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <Badge tone="accent" className="mb-6 font-mono">
            Privacy-first · Open source
          </Badge>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            With AI companies racing to harvest your data,{" "}
            <span className="text-accent">forget-me</span> deletes everything connected to
            your email — automatically.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Your email is connected to dozens — sometimes hundreds — of services. You have a
            legal right to have that data deleted. forget-me finds them, sends real deletion
            requests, and tracks the responses. Without ever touching your accounts.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/search" size="lg">
              Try free
            </ButtonLink>
            <ButtonLink href="/pricing" variant="outline" size="lg">
              Start trial
            </ButtonLink>
          </div>

          {/* Live stats strip */}
          <div className="mt-14 grid max-w-3xl grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
            {statItems.map((s) => (
              <div key={s.label} className="bg-bg p-5">
                <div className="font-mono text-2xl font-semibold text-accent">
                  {formatNumber(s.value)}
                </div>
                <div className="mt-1 text-xs text-muted">{s.label}</div>
              </div>
            ))}
          </div>
          {!stats && (
            <p className="mt-3 text-xs text-faint">
              Live stats are unavailable right now — showing placeholders.
            </p>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Four steps to a smaller footprint
          </h2>
          <p className="mt-3 text-muted">
            Each step is built to be abuse-resistant and privacy-preserving from the ground up.
          </p>
        </div>
        <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-6 transition-colors hover:bg-surface-2">
              <div className="mb-4 flex h-10 w-10 items-center justify-center border border-accent/40 text-accent">
                <svg viewBox="0 0 18 18" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
                  {f.icon}
                </svg>
              </div>
              <h3 className="text-base font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight">
                Free to discover. Pay only to automate.
              </h2>
              <p className="mt-3 text-muted">
                Run searches and read every guide for free. Upgrade when you want forget-me to
                send and track deletion requests on your behalf.
              </p>
            </div>
            <div className="flex flex-wrap items-baseline gap-4">
              <div className="border border-line bg-bg px-5 py-4">
                <div className="text-xs uppercase tracking-wide text-faint">Free</div>
                <div className="mt-1 font-mono text-2xl font-semibold">$0</div>
              </div>
              <div className="border border-accent bg-bg px-5 py-4">
                <div className="text-xs uppercase tracking-wide text-accent">Monthly</div>
                <div className="mt-1 font-mono text-2xl font-semibold">$12</div>
              </div>
              <ButtonLink href="/pricing" size="lg">
                See pricing
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <Badge tone="muted" className="mb-4 font-mono">
            What forget-me deliberately does NOT do
          </Badge>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Trust is the whole product
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {TRUST.map((t) => (
            <Card key={t.title} hover>
              <CardBody>
                <div className="mb-3 flex h-8 w-8 items-center justify-center border border-success/40 text-success">
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M3 8.5l3 3 7-7" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold tracking-tight">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight">
            Find out where your email lives.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            It takes one minute and costs nothing. No account required to search.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <ButtonLink href="/search" size="lg">
              Start a free search
            </ButtonLink>
            <Link
              href="https://github.com/DaltonTheDeveloper/forget-me"
              className="inline-flex items-center text-sm text-muted hover:text-fg"
              target="_blank"
              rel="noreferrer"
            >
              View source on GitHub →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
