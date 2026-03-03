#!/bin/sh
# AniGa – Update-Script für Synology
# Ausführen nach dem Hochladen neuer Dateien:  sh update.sh

echo "🔄 Stoppe alten Container..."
docker compose down

echo "🏗️  Baue neues Image..."
docker compose build --no-cache

echo "🚀 Starte Container..."
docker compose up -d

echo "✅ Fertig! AniGa läuft auf Port 3000"
