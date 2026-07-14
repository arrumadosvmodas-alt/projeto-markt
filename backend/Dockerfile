# ── Estágio 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY . .
RUN npm run build

# ── Estágio 2: Runtime mínimo ──────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 4000

# db push é mais seguro que migrate deploy quando não há pasta migrations
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
