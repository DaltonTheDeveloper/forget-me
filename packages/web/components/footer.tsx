import Link from "next/link";
import { Logo } from "@/components/logo";

const GITHUB = "https://github.com/DaltonTheDeveloper/forget-me";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/search", label: "Search" },
      { href: "/guides", label: "Guides" },
      { href: "/pricing", label: "Pricing" },
      { href: "/stats", label: "Stats" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/auth/signin", label: "Sign in" },
      { href: "/auth/signup", label: "Sign up" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/account/billing", label: "Billing" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Discover where your email is registered and send real, verification-gated
            GDPR/CCPA deletion requests — without ever touching your accounts.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
              {col.title}
            </h4>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
            Open source
          </h4>
          <ul className="space-y-2">
            <li>
              <a href={GITHUB} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href={`${GITHUB}/blob/main/SECURITY.md`} className="text-sm text-muted hover:text-fg" target="_blank" rel="noreferrer">
                Security
              </a>
            </li>
            <li>
              <a href={`${GITHUB}/blob/main/CONTRIBUTING.md`} className="text-sm text-muted hover:text-fg" target="_blank" rel="noreferrer">
                Contribute
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-faint sm:flex-row sm:items-center sm:px-6">
          <p>© {new Date().getFullYear()} forget-me · MIT licensed</p>
          <p className="font-mono">
            We never store passwords · never access accounts · verification-gated
          </p>
        </div>
      </div>
    </footer>
  );
}
