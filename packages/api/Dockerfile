# Build the forget-me API from the monorepo root context.
FROM oven/bun:1.3-alpine AS base
WORKDIR /app

# Install workspace deps (cached on lockfile changes).
COPY package.json bun.lock* ./
COPY packages/shared/package.json packages/shared/
COPY packages/api/package.json packages/api/
RUN bun install --frozen-lockfile || bun install

# Copy source.
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY packages/api packages/api
COPY guides guides

ENV PORT=3001
EXPOSE 3001
WORKDIR /app/packages/api
CMD ["bun", "run", "start"]
