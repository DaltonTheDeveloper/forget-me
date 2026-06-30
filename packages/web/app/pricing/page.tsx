import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, clerkEnabled } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free to discover. Affordable plans to automate and track GDPR/CCPA deletion requests.",
};

const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Discover where your email is registered and read every guide.",
    cta: "Start free",
    href: clerkEnabled ? "/auth/signup" : "/search",
    featured: false,
    features: [
      "Unlimited email discovery searches",
      "Full access to 500+ deletion guides",
      "Self-service step-by-step instructions",
      "Public stats dashboard",
    ],
    missing: ["Automated deletion sending", "Response tracking", "Proof export"],
  },
  {
    name: "Monthly",
    price: "$12",
    cadence: "/ month",
    blurb: "Let forget-me send and track deletion requests for you.",
    cta: "Start trial",
    href: clerkEnabled ? "/auth/signup" : "/search",
    featured: true,
    features: [
      "Everything in Free",
      "Automated, verification-gated sending",
      "Live response tracking & retries",
      "One-click links for web-only forms",
      "Exportable proof of every request",
    ],
    missing: [],
  },
  {
    name: "Annual",
    price: "$99",
    cadence: "/ year",
    blurb: "Two months free versus monthly. Best for ongoing cleanup.",
    cta: "Go annual",
    href: clerkEnabled ? "/auth/signup" : "/search",
    featured: false,
    features: [
      "Everything in Monthly",
      "Save ~31% vs. monthly billing",
      "Priority email support",
      "Scheduled re-scans of your email",
    ],
    missing: [],
  },
  {
    name: "Lifetime",
    price: "$199",
    cadence: "once",
    blurb: "Pay once. Own it forever. Support an open-source project.",
    cta: "Buy lifetime",
    href: clerkEnabled ? "/auth/signup" : "/search",
    featured: false,
    features: [
      "Everything in Annual",
      "One payment, no renewals",
      "All future features included",
      "Founder's badge on contributions",
    ],
    missing: [],
  },
];

const FAQ = [
  {
    q: "Do you store passwords?",
    a: "No. forget-me never asks for, stores, or transmits your passwords or 2FA codes. We never log into your accounts. There is nothing sensitive for us to leak.",
  },
  {
    q: "Is this legal?",
    a: "Yes — GDPR/CCPA. The right to erasure is established law (GDPR Article 17, CCPA §1798.105, plus LGPD and PIPEDA). forget-me simply sends legally-worded requests on your behalf, with your verified consent.",
  },
  {
    q: "Why verification?",
    a: "Because sending deletion requests for an email you don't own would be abuse. Before anything is sent, you prove ownership of the email with a one-click confirmation link. No verification, no sending — full stop.",
  },
  {
    q: "What happens to services that only accept web forms?",
    a: "We never impersonate you in a browser. For form-only services, forget-me hands you a pre-filled one-click link that you submit yourself, in your own browser session.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Monthly and annual plans can be cancelled at any time from your billing page; you keep access until the end of your current period.",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <Badge tone="accent" className="mb-4 font-mono">
          Simple, honest pricing
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Free to discover. Pay only to automate.
        </h1>
        <p className="mt-4 text-muted">
          Searching and reading guides is always free. Upgrade when you want forget-me to send
          and track deletion requests for you.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => (
          <Card
            key={tier.name}
            className={cn(
              "flex flex-col",
              tier.featured && "border-accent shadow-[0_0_0_1px_var(--color-accent)]",
            )}
          >
            <CardBody className="flex flex-1 flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-fg">
                  {tier.name}
                </h2>
                {tier.featured && <Badge tone="accent">Popular</Badge>}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-mono text-3xl font-semibold">{tier.price}</span>
                <span className="text-sm text-faint">{tier.cadence}</span>
              </div>
              <p className="mt-3 text-sm text-muted">{tier.blurb}</p>

              <ul className="mt-5 space-y-2.5 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2 text-fg">
                    <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-success" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M3 8.5l3 3 7-7" />
                    </svg>
                    {f}
                  </li>
                ))}
                {tier.missing.map((f) => (
                  <li key={f} className="flex gap-2 text-faint line-through">
                    <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-2">
                <ButtonLink
                  href={tier.href}
                  variant={tier.featured ? "primary" : "secondary"}
                  className="w-full"
                >
                  {tier.cta}
                </ButtonLink>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <div className="mx-auto mt-20 max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="divide-y divide-line border-y border-line">
          {FAQ.map((item) => (
            <details key={item.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-base font-medium text-fg">
                {item.q}
                <svg
                  viewBox="0 0 16 16"
                  className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M8 3v10M3 8h10" />
                </svg>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
