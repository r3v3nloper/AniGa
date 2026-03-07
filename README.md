# AniGa 🌸

> **Anime & Manga Tracker** — Eine selbst gehostete Progressive Web App zum Verfolgen deiner Anime- und Manga-Liste.

[![Build & Push Docker Image](https://github.com/actions/workflows/badge.svg)](../../actions/workflows/docker.yml)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installierbar-5A0FC8?logo=pwa&logoColor=white)

---

## Funktionen

### Kernfunktionen
| Funktion | Beschreibung |
|---|---|
| 🔐 **Authentifizierung** | Registrierung & Login via E-Mail + Passwort, JWT (30 Tage gültig) |
| 👤 **Profil bearbeiten** | Benutzername, E-Mail und Passwort ändern |
| 🎬 **Anime tracken** | Status, aktuelle Episode, Bewertung (1–5 Sterne), Notizen |
| 📚 **Manga tracken** | Status, aktuelles Kapitel + Seite, Bewertung, Notizen |
| 🔍 **Suche** | Anime & Manga über Jikan (MyAnimeList) suchen, 20 Ergebnisse pro Seite |
| 📋 **Listen-Ansicht** | Statusfilter, Textfilter, Grid- oder Listenansicht |
| ✏️ **Manueller Eintrag** | Eigene Einträge ohne MAL-Verknüpfung anlegen |

### Entdecken & Empfehlungen
| Funktion | Beschreibung |
|---|---|
| 🏆 **Top Anime/Manga** | Bestbewertete Titel auf der Startseite |
| 🌸 **Saisonal** | Aktuell laufende Anime der Season |
| ✨ **Empfehlungen** | Personalisierte Vorschläge basierend auf deinen meistgeschauten Genres (gewichtet nach Bewertung) |
| ▶️ **Streaming-Info** | Zeigt verfügbare Streaming-Dienste pro Anime (Crunchyroll, Netflix, etc.) |

### Soziale Funktionen
| Funktion | Beschreibung |
|---|---|
| 👥 **Nutzer-Übersicht** | Alle registrierten Nutzer mit Anime/Manga-Anzahl |
| ➕ **Folgen** | Anderen Nutzern folgen und ihre Liste einsehen |
| ⚖️ **Vergleichen** | Liste mit einem anderen Nutzer vergleichen — was haben beide gesehen, was nur einer? |

### Administration
| Funktion | Beschreibung |
|---|---|
| 🛡️ **Admin-Panel** | Alle Nutzer einsehen, Passwörter zurücksetzen, Nutzer löschen |

### Technisch
| Funktion | Beschreibung |
|---|---|
| 📱 **PWA** | Installierbar auf Mobilgeräten, Offline-fähig via Service Worker |
| 🌙 **Dark Theme** | Durchgängiges dunkles Design mit CSS-Variablen |
| 📐 **Responsiv** | Sidebar-Layout auf Desktop, Bottom-Navigation auf Mobil |
| 🐳 **Docker-ready** | Multi-Stage Dockerfile, docker-compose, GitHub Container Registry |

---

## Tech Stack

### Backend
| Paket | Version | Zweck |
|---|---|---|
| `express` | ^4.18 | HTTP-Server & Routing |
| `better-sqlite3` | ^11.10 | SQLite-Datenbank (synchron) |
| `jsonwebtoken` | ^9.0 | JWT-Authentifizierung |
| `bcryptjs` | ^2.4 | Passwort-Hashing |
| `cors` | ^2.8 | Cross-Origin-Anfragen |
| `dotenv` | ^16.4 | Umgebungsvariablen |

### Frontend
- **Vanilla JavaScript** (kein Framework)
- HTML5 + CSS3 mit Custom Properties
- Service Worker (`sw.js`) für Offline-Cache
- PWA Manifest (`manifest.json`)

### Externe API
- **[Jikan v4](https://jikan.moe/)** — Kostenlose MyAnimeList-API, kein API-Key nötig
  - Rate Limit: 450 ms zwischen Anfragen (serverseitig umgesetzt)
  - Endpunkte: Suche, Details, Streaming, Top, Seasonal

---

## Schnellstart (lokale Entwicklung)

### Voraussetzungen
- **Node.js** ≥ 20
- **npm** ≥ 9

### Installation

```bash
# 1. Repository klonen
git clone https://github.com/DEIN-USERNAME/aniga.git
cd aniga

# 2. Abhängigkeiten installieren
npm install

# 3. Umgebungsvariablen anlegen
cp .env.example .env
# .env anpassen (JWT_SECRET setzen!)

# 4. Server starten
npm start
# oder mit Auto-Reload:
npm run dev
```

Die App ist dann unter **http://localhost:3000** erreichbar.

> **Hinweis:** Die SQLite-Datenbank (`aniga.db`) wird beim ersten Start automatisch angelegt.

---

## Docker Deployment

### Option A — docker compose (empfohlen)

```bash
# Image bauen und Container starten
docker compose up -d

# Logs anzeigen
docker compose logs -f

# Container stoppen
docker compose down
```

Die Datenbank wird in einem Docker-Volume (`aniga-data`) persistent gespeichert.

### Option B — Manueller Docker-Befehl

```bash
# Image bauen
docker build -t aniga .

# Container starten (Daten in /srv/aniga/data auf dem Host)
docker run -d \
  --name aniga \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /srv/aniga/data:/data \
  -e DATA_DIR=/data \
  -e JWT_SECRET=dein-geheimer-schluessel \
  aniga
```

> **Wichtig:** `-e DATA_DIR=/data` muss gesetzt sein, damit die Datenbank im Volume-Verzeichnis liegt und bei Neustarts erhalten bleibt.

### Update (Synology / NAS)

Nach dem Hochladen neuer Dateien:

```bash
sh update.sh
```

Das Script führt `docker compose down && docker compose build --no-cache && docker compose up -d` aus.

---

## CI/CD (GitHub Actions)

Bei jedem Push auf `main` wird automatisch:
1. Das Docker-Image gebaut (Multi-Stage Build)
2. In die **GitHub Container Registry (GHCR)** gepusht

```
ghcr.io/DEIN-USERNAME/aniga:latest
ghcr.io/DEIN-USERNAME/aniga:COMMIT-SHA
```

Image von GHCR ziehen:

```bash
docker pull ghcr.io/DEIN-USERNAME/aniga:latest
```

---

## Umgebungsvariablen

| Variable | Standard | Beschreibung |
|---|---|---|
| `PORT` | `3000` | Port des HTTP-Servers |
| `JWT_SECRET` | `aniga-secret-key` | Geheimer Schlüssel für JWT — **in Produktion unbedingt ändern!** |
| `DATA_DIR` | `__dirname` (Projektordner) | Verzeichnis für die SQLite-Datei — bei Docker auf `/data` setzen |

`.env.example`:
```env
PORT=3000
JWT_SECRET=your-super-secret-key-change-this
```

---

## Projektstruktur

```
aniga/
├── .github/
│   └── workflows/
│       └── docker.yml         # CI/CD: Build & Push zu GHCR
├── middleware/
│   ├── auth.js                # JWT-Verifikation → req.userId
│   └── admin.js               # Admin-Check → req.userId + is_admin
├── public/
│   ├── css/
│   │   └── style.css          # Dark Theme, CSS Custom Properties
│   ├── icons/                 # App-Icons (192px, 512px, Logo)
│   ├── js/
│   │   ├── api.js             # Frontend HTTP-Client (globales API-Objekt)
│   │   └── app.js             # Haupt-SPA (~2300 Zeilen, State in S{})
│   ├── index.html             # App-Shell (1 HTML-Datei)
│   ├── manifest.json          # PWA-Manifest
│   └── sw.js                  # Service Worker (Cache-first)
├── routes/
│   ├── admin.js               # /api/admin — Nutzerverwaltung
│   ├── auth.js                # /api/auth — Register, Login, Profil
│   ├── list.js                # /api/list — CRUD Nutzerliste + Stats
│   ├── recommendations.js     # /api/recommendations — Genre-Empfehlungen
│   ├── search.js              # /api/search — Jikan-Proxy
│   └── users.js               # /api/users — Profile, Folgen, Vergleich
├── .dockerignore
├── .env.example
├── .gitignore
├── db.js                      # SQLite-Schema & Initialisierung
├── docker-compose.yml
├── Dockerfile                 # Multi-Stage Build
├── package.json
├── server.js                  # Express-App (Einstiegspunkt)
└── update.sh                  # Update-Script für Synology/NAS
```

---

## API-Übersicht

### Authentifizierung (`/api/auth`)
| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `POST` | `/register` | — | Neues Konto anlegen |
| `POST` | `/login` | — | Anmelden → JWT-Token |
| `GET` | `/me` | ✅ | Eigenes Profil abrufen |
| `PUT` | `/profile` | ✅ | Profil bearbeiten (Name, E-Mail, Passwort) |

### Liste (`/api/list`)
| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/` | ✅ | Liste abrufen (`?type=anime&status=watching`) |
| `GET` | `/stats` | ✅ | Statistiken (Anzahl, Episoden, Kapitel) |
| `GET` | `/check` | ✅ | Eintrag prüfen (`?malId=XXX&type=anime`) |
| `POST` | `/` | ✅ | Eintrag hinzufügen / aktualisieren |
| `PUT` | `/:id` | ✅ | Eintrag bearbeiten |
| `DELETE` | `/:id` | ✅ | Eintrag löschen |

### Suche (`/api/search`)
| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/anime` | — | Anime suchen (`?q=...&page=1`) |
| `GET` | `/manga` | — | Manga suchen |
| `GET` | `/anime/:id` | — | Anime-Details |
| `GET` | `/anime/:id/streaming` | — | Streaming-Dienste für Anime |
| `GET` | `/manga/:id` | — | Manga-Details |
| `GET` | `/top/anime` | — | Top-Anime nach Bewertung |
| `GET` | `/top/manga` | — | Top-Manga |
| `GET` | `/seasonal` | — | Anime der aktuellen Saison |

### Nutzer (`/api/users`)
| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/` | ✅ | Alle Nutzer (mit Follow-Status) |
| `GET` | `/following` | ✅ | Gefolgten Nutzern |
| `GET` | `/:id/profile` | ✅ | Profil eines Nutzers |
| `GET` | `/:id/list` | ✅ | Liste eines Nutzers |
| `GET` | `/:id/compare` | ✅ | Eigene Liste vs. andere (`?type=anime`) |
| `POST` | `/:id/follow` | ✅ | Nutzer folgen |
| `DELETE` | `/:id/follow` | ✅ | Entfolgen |

### Empfehlungen (`/api/recommendations`)
| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/` | ✅ | Empfehlungen (`?type=anime\|manga`) |

### Admin (`/api/admin`)
| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/users` | 🛡️ Admin | Alle Nutzer auflisten |
| `DELETE` | `/users/:id` | 🛡️ Admin | Nutzer löschen |
| `PUT` | `/users/:id/password` | 🛡️ Admin | Passwort zurücksetzen |

---

## Datenbankschema

### `users`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INTEGER PK | Auto-Increment |
| `username` | TEXT UNIQUE | Anzeigename |
| `email` | TEXT UNIQUE | Für Login |
| `password_hash` | TEXT | bcrypt-Hash |
| `is_admin` | INTEGER | `0` = Nutzer, `1` = Admin |
| `created_at` | DATETIME | Registrierungsdatum |

### `media_entries`
Zentrale Mediendatenbank (anime + manga aus Jikan oder manuell).

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INTEGER PK | |
| `mal_id` | INTEGER | MyAnimeList-ID (NULL bei manuell) |
| `source` | TEXT | `jikan` oder `manual` |
| `type` | TEXT | `anime` oder `manga` |
| `title` | TEXT | Haupttitel |
| `title_german` / `title_english` / `title_japanese` | TEXT | Weitere Titel |
| `image_url` | TEXT | Cover-Bild-URL |
| `synopsis` | TEXT | Beschreibung |
| `media_status` | TEXT | `Finished Airing`, `Currently Airing`, etc. |
| `episodes` / `chapters` / `volumes` | INTEGER | |
| `api_score` | REAL | MAL-Bewertung |
| `genres` | TEXT | JSON-Array als String |
| `year` / `season` | | Erscheinungsjahr/Saison |
| `is_manual` | INTEGER | `1` = manueller Eintrag |

> **UNIQUE-Constraint:** `(mal_id, type, source)` — verhindert Duplikate.

### `user_list`
Verknüpft Nutzer mit Medien.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INTEGER PK | |
| `user_id` | INTEGER FK | → `users.id` |
| `media_id` | INTEGER FK | → `media_entries.id` |
| `list_status` | TEXT | `watching`, `completed`, `on_hold`, `dropped`, `plan_to_watch` |
| `current_episode` / `current_chapter` / `current_page` | INTEGER | Fortschritt |
| `user_score` | REAL | Eigene Bewertung (0.5 – 5.0) |
| `notes` | TEXT | Eigene Notizen |
| `started_at` / `completed_at` / `updated_at` | DATETIME | |

> **UNIQUE-Constraint:** `(user_id, media_id)`.

### `user_follows`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `follower_id` | INTEGER FK | Wer folgt |
| `following_id` | INTEGER FK | Wem gefolgt wird |

---

## Standard-Admin

Beim ersten Start wird automatisch ein Admin-Konto angelegt:

| Feld | Wert |
|---|---|
| E-Mail | `main@tech.de` |
| Passwort | `IchBinEinAdmin!` |

> ⚠️ **Das Passwort nach dem ersten Login im Admin-Panel oder unter Profil ändern!**

---

## Empfehlungs-Algorithmus

Die Empfehlungen funktionieren ohne ML:

1. Genres aus der Nutzerliste werden gezählt (Gewicht = Nutzerbewertung oder 3 als Standard)
2. Die **Top 3 Genres** werden als MAL-Genre-IDs übersetzt
3. Jikan wird mit `?genres=X,Y,Z&order_by=score&sort=desc` abgefragt
4. Bereits getrackte Titel werden herausgefiltert
5. Es werden maximal **12 Empfehlungen** zurückgegeben
6. **Fallback:** Hat der Nutzer noch keine Liste, werden die populärsten Anime/Manga angezeigt

---

## Docker-Image (Multi-Stage Build)

```dockerfile
# Stage 1: Build — kompiliert better-sqlite3 (benötigt Python, make, g++)
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
RUN npm ci --omit=dev

# Stage 2: Runtime — sauberes Image ohne Build-Tools
FROM node:20-alpine
COPY --from=builder /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
VOLUME ["/data"]
CMD ["node", "server.js"]
```

> **Hinweis:** `better-sqlite3` muss mindestens `^11.10.0` sein, damit vorkompilierte Binaries für Node.js 20+ genutzt werden können.

---

## Changelog

| Version | Änderung |
|---|---|
| 1.0 | Grundfunktionen: Auth, Anime/Manga tracken, Suche |
| 1.1 | Nutzerliste, Folgen-System |
| 1.2 | Admin-Panel |
| 1.3 | Listen-Vergleich zwischen Nutzern |
| 1.4 | Streaming-Dienste im Track-Modal |
| 1.5 | Personalisierte Genre-Empfehlungen auf der Startseite |
| 1.6 | Profil bearbeiten (Name, E-Mail, Passwort) |

---

*Gebaut mit ❤️ und 🌸*
