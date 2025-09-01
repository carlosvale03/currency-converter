# ---- base ----
FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- deps: instala TODAS as deps (inclui dev) ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ---- build: gera artefatos standalone ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# build em modo prod (sem telemetria)
ENV NODE_ENV=production
RUN npm run build

# ---- runner: imagem final, só com o necessário p/ rodar ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# usuário não-root
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# copia somente o que precisa no runtime
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# healthcheck simples (usa busybox/wget do Alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
