import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-baseline gap-2 font-mono text-base", className)}
    >
      <span className="flex h-6 w-6 items-center justify-center border border-accent text-accent">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4h12M4 4l1 9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-9M6 4V2.5A.5.5 0 0 1 6.5 2h3a.5.5 0 0 1 .5.5V4" />
        </svg>
      </span>
      <span className="font-semibold tracking-tight text-fg">
        forget<span className="text-accent">-me</span>
      </span>
    </Link>
  );
}
