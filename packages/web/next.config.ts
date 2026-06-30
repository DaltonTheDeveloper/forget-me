import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Don't fail the production build on lint/type errors that don't affect runtime;
  // we still run `tsc --noEmit` / `next lint` separately in CI.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
