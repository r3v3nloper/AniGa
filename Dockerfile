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

# Datenverzeichnis dem node-User übereignen, damit der Container nicht als root laufen muss.
# MUSS vor VOLUME stehen — Änderungen an einem bereits deklarierten Volume-Pfad
# werden von Docker verworfen. Named Volumes übernehmen diese Rechte beim ersten Mount.
# ACHTUNG bei Bind-Mounts (-v /srv/aniga/data:/data): dort gelten die Rechte des
# Host-Verzeichnisses — dieses einmalig `chown -R 1000:1000` setzen.
RUN mkdir -p /data && chown -R node:node /data /app

# Datenbank-Volume (wird von außen gemountet)
VOLUME ["/data"]

# Nicht als root laufen (der node-User ist im Basisimage bereits vorhanden)
USER node

CMD ["node", "server.js"]
