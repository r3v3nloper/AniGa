# ── Stage 1: Build (mit Kompilier-Tools für better-sqlite3) ──────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: Runtime (sauberes Image ohne Build-Tools) ───────────────────────
FROM node:20-alpine

WORKDIR /app

# Kompilierte node_modules aus dem Builder-Stage übernehmen
COPY --from=builder /app/node_modules ./node_modules

# App-Dateien kopieren
COPY . .

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
