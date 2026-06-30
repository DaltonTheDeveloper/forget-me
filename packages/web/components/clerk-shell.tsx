import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/utils";

/**
 * Wraps children in ClerkProvider ONLY when a publishable key is present.
 * With no key, ClerkProvider is never mounted, so the app builds and runs
 * with zero env vars set. Clerk's dark look is themed via `appearance`.
 */
export function ClerkShell({ children }: { children: ReactNode }) {
  if (!clerkEnabled) return <>{children}</>;
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#f59e0b",
          colorBackground: "#141414",
          colorText: "#fafafa",
          colorInputBackground: "#0f0f0f",
          colorInputText: "#fafafa",
          borderRadius: "0px",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
