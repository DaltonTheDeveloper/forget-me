import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-none font-medium tracking-tight transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 border";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg border-accent hover:bg-accent-hover hover:border-accent-hover",
  secondary:
    "bg-surface text-fg border-line hover:bg-surface-2 hover:border-line-strong",
  outline:
    "bg-transparent text-fg border-line hover:border-accent hover:text-accent",
  ghost: "bg-transparent text-muted border-transparent hover:text-fg hover:bg-surface",
  danger: "bg-transparent text-danger border-danger/40 hover:bg-danger/10 hover:border-danger",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  href,
  ...props
}: ButtonLinkProps) {
  const cls = cn(base, variants[variant], sizes[size], className);
  const external = /^https?:\/\//.test(href);
  if (external) {
    return <a href={href} className={cls} {...props} />;
  }
  return <Link href={href} className={cls} {...(props as any)} />;
}
