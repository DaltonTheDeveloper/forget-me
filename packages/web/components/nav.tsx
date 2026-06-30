"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn, clerkEnabled } from "@/lib/utils";

const LINKS = [
  { href: "/search", label: "Search" },
  { href: "/guides", label: "Guides" },
  { href: "/pricing", label: "Pricing" },
  { href: "/stats", label: "Stats" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            {LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "text-sm transition-colors",
                    active ? "text-accent" : "text-muted hover:text-fg",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/auth/signin" className="text-sm text-muted hover:text-fg">
            Sign in
          </Link>
          <ButtonLink href={clerkEnabled ? "/auth/signup" : "/search"} size="sm">
            Try free
          </ButtonLink>
        </div>

        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center border border-line text-fg md:hidden"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            {open ? <path d="M3 3l10 10M13 3L3 13" /> : <path d="M2 4h12M2 8h12M2 12h12" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-bg md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-3 text-sm text-muted hover:text-fg"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-3 py-3">
              <ButtonLink href="/auth/signin" variant="secondary" size="sm" className="flex-1">
                Sign in
              </ButtonLink>
              <ButtonLink href={clerkEnabled ? "/auth/signup" : "/search"} size="sm" className="flex-1">
                Try free
              </ButtonLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
