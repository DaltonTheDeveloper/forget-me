import { Card, CardBody } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export function AuthNotConfigured({ feature = "Authentication" }: { feature?: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <Card>
        <CardBody className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-line text-accent">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="5" y="11" width="14" height="9" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Auth not configured</h1>
          <p className="mt-2 text-sm text-muted">
            {feature} requires Clerk. Set{" "}
            <code className="font-mono text-accent">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
            <code className="font-mono text-accent">CLERK_SECRET_KEY</code> in your environment,
            then restart the app.
          </p>
          <p className="mt-2 text-xs text-faint">
            The discovery, guides and stats features all work without an account.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <ButtonLink href="/search" size="sm">
              Try the free search
            </ButtonLink>
            <ButtonLink href="/guides" variant="secondary" size="sm">
              Browse guides
            </ButtonLink>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
