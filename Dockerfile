# Envio HyperIndex — matches workspace Node 20 + pnpm
FROM node:20-bookworm-slim AS base

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate

# Optional local link:./generated must exist before install
RUN mkdir -p generated

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm codegen

# Don't set NODE_ENV=production — Envio generated Env.res drops dev fallbacks and
# requires many extra env vars (SSL, Hasura role, throttle intervals, etc.).
ENV TUI_OFF=true

CMD ["pnpm", "start"]
