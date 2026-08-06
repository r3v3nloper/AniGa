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
| 🎥 **Filme & Serien tracken** | Eigener Bereich mit Umschalter in der Sidebar — Serien mit Episoden-Fortschritt und Staffeln, Filme ohne Fortschritt; Daten via TMDB (deutsch) |
| 📦 **Physischer Besitz** | Pro Eintrag markieren, ob man ihn physisch besitzt; bei Manga inkl. Bände-Zähler (y / x); Badge auf den Karten |
| 🔍 **Suche** | Anime & Manga über Jikan (MyAnimeList) suchen, 20 Ergebnisse pro Seite; AniList als automatischer Fallback |
| 📋 **Listen-Ansicht** | Statusfilter, Textfilter, Collection-Filter, Grid- oder Listenansicht |
| 📂 **Collections** | Eigene Sammlungen (z.B. „ReWatch") — ein Eintrag kann in beliebig vielen Collections sein, typ-übergreifend (Anime + Manga gemischt); Zuordnung per Chips im Track-Modal |
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
| 📐 **Responsiv** | Sidebar-Layout auf Desktop; mobile Bottom-Navigation mit 5 Kern-Items + „Mehr"-Bottom-Sheet (Collections, Nutzer, Profil, Admin) |
| 🔄 **API-Fallback** | Wenn Jikan/MyAnimeList nicht erreichbar ist, springt AniList (GraphQL) transparent ein |
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
| `helmet` | ^8.3 | Security-Header (CSP, X-Frame-Options, …) |
| `express-rate-limit` | ^8.6 | Brute-Force-Schutz auf Auth-Routen |

### Frontend
- **Vanilla JavaScript** (kein Framework) — native ES-Module (`<script type="module">`)
- HTML5 + CSS3 mit Custom Properties
- Service Worker (`sw.js`) für Offline-Cache
- PWA Manifest (`manifest.json`)

### Externe APIs
- **[Jikan v4](https://jikan.moe/)** — Kostenlose MyAnimeList-API, kein API-Key nötig (primär)
  - Rate Limit: 450 ms zwischen Anfragen (serverseitig umgesetzt)
  - Endpunkte: Suche, Details, Streaming, Top, Seasonal
- **[AniList GraphQL](https://docs.anilist.co/)** — Kostenlose GraphQL-API, kein API-Key nötig (Fallback)
  - Springt automatisch ein, wenn Jikan/MAL nicht erreichbar ist (z.B. MAL-Ausfall)
  - Liefert MAL-IDs mit (`idMal`), daher bleibt die `mal_id`-basierte Datenbank konsistent
  - Ergebnisse ohne MAL-ID werden verworfen; AniList-Status wird auf MAL-Status-Strings gemappt
  - Rate Limit: 700 ms zwischen Anfragen (serverseitig umgesetzt)
- **[TMDB](https://www.themoviedb.org/)** — Filme & Serien (kostenloser API-Token nötig)
  - `TMDB_API_TOKEN` in `.env` setzen (v4-Lesezugriffstoken `eyJ…` **oder** v3-Schlüssel — Format wird automatisch erkannt)
  - Deutsche Titel/Beschreibungen (`language=de-DE`); TMDB-Status wird auf die vorhandenen Badge-Strings gemappt
  - Die TMDB-ID wird im `mal_id`-Feld gespeichert, `source='tmdb'` unterscheidet die Provider
  - Ohne konfigurierten Token liefern die Film/Serien-Endpoints 503

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

### Tests

```bash
npm test
```

Nutzt den eingebauten `node:test`-Runner — keine zusätzlichen Dependencies. Jede Testdatei
läuft in einem eigenen Prozess mit einer frischen Temp-SQLite-DB; die Routen-Tests fahren
die echte Express-App auf einem ephemeren Port hoch.

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

> **Wichtig:**
> - `-e JWT_SECRET=...` ist **Pflicht** — ohne diese Variable startet der Server nicht (Exit mit Fehler).
> - `-e DATA_DIR=/data` muss gesetzt sein, damit die Datenbank im Volume-Verzeichnis liegt und bei Neustarts erhalten bleibt.

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

| Variable | Pflicht | Standard | Beschreibung |
|---|---|---|---|
| `JWT_SECRET` | **Ja** | — | Geheimer Schlüssel für JWT. **Ohne diese Variable startet der Server nicht!** |
| `PORT` | Nein | `3000` | Port des HTTP-Servers |
| `DATA_DIR` | Nein | `__dirname` (Projektordner) | Verzeichnis für die SQLite-Datei — bei Docker auf `/data` setzen |
| `ADMIN_EMAIL` | Nein | `admin@aniga.local` | E-Mail des Admin-Kontos (nur beim ersten Start relevant) |
| `ADMIN_PASSWORD` | Nein | — | Passwort des Admin-Kontos. Wird nur gesetzt, wenn noch kein Admin existiert |
| `CORS_ORIGIN` | Nein | `http://localhost:PORT` | Erlaubte Origin für CORS-Anfragen |
| `TMDB_API_TOKEN` | Nein | — | TMDB-Token für Filme & Serien (v4-Lesezugriffstoken oder v3-Schlüssel). Ohne Token liefern die Film/Serien-Endpoints 503 |

`.env.example`:
```env
PORT=3000
JWT_SECRET=your-super-secret-key-change-this
ADMIN_EMAIL=admin@aniga.local
ADMIN_PASSWORD=MeinSicheresPasswort123
TMDB_API_TOKEN=eyJ...
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
│   ├── js/                    # Frontend als ES-Module (kein Framework)
│   │   ├── main.js            # Einstiegspunkt: Boot, App-Shell, Logout, PWA-Install
│   │   ├── api.js             # HTTP-Client (exportiert API-Objekt)
│   │   ├── state.js           # Zentraler App-State (S)
│   │   ├── icons.js           # Inline-SVG-Icons (IC)
│   │   ├── dom.js             # DOM-Helfer, esc(), coverImg(), Toast
│   │   ├── modal.js           # Generisches Modal-Overlay
│   │   ├── media.js           # Status-Mappings, Medien-Helfer, Karten-Komponenten
│   │   ├── shell.js           # Sidebar, Mobile-Header, Bottom-Nav
│   │   ├── router.js          # View-Navigation + Daten-Laden pro View
│   │   ├── views/             # Eine Datei pro Ansicht
│   │   │   ├── auth.js        # Login/Registrierung
│   │   │   ├── home.js        # Dashboard + Empfehlungen
│   │   │   ├── search.js      # Suche, Top-Listen, Seasonal
│   │   │   ├── lists.js       # Eigene Anime-/Manga-Liste
│   │   │   ├── profile.js     # Profil + Bearbeiten-Modal
│   │   │   ├── admin.js       # Admin-Panel
│   │   │   ├── users.js       # Nutzerliste, Folgen, fremde Listen
│   │   │   ├── compare.js     # Listen-Vergleich
│   │   │   └── collections.js # Collections: Übersicht + Detail
│   │   └── modals/
│   │       ├── track.js       # Tracking-Modal (Hinzufügen/Bearbeiten)
│   │       └── manual.js      # Modal für manuelle Einträge
│   ├── index.html             # App-Shell (1 HTML-Datei)
│   ├── manifest.json          # PWA-Manifest
│   └── sw.js                  # Service Worker (Cache-first)
├── routes/
│   ├── admin.js               # /api/admin — Nutzerverwaltung
│   ├── auth.js                # /api/auth — Register, Login, Profil
│   ├── collections.js         # /api/collections — eigene Sammlungen
│   ├── list.js                # /api/list — CRUD Nutzerliste + Stats
│   ├── recommendations.js     # /api/recommendations — Genre-Empfehlungen
│   ├── search.js              # /api/search — Jikan-Proxy mit AniList-Fallback
│   └── users.js               # /api/users — Profile, Folgen, Vergleich
├── utils/
│   ├── anilist.js             # AniList GraphQL-Client (Fallback-Provider)
│   ├── jikan.js               # Jikan-Client mit Rate-Limiter + formatMedia()
│   ├── mediaStore.js          # Persistenz für media_entries (Upsert-Logik)
│   ├── sql.js                 # Wiederverwendbare SQL-Subqueries
│   └── tmdb.js                # TMDB-Client für Filme & Serien (de-DE)
├── tests/                     # Testsuite (node:test, keine Extra-Dependency)
│   ├── helpers/
│   │   └── setup.js           # Temp-DB + Testserver auf ephemerem Port
│   ├── routes/                # Integrationstests gegen die echte App
│   │   ├── auth.test.js       # Register/Login/Token-Invalidierung
│   │   ├── list.test.js       # Listen-CRUD inkl. Besitz-Feldern
│   │   └── users.test.js      # Follow, Vergleich, Notes-Privacy-Regression
│   └── utils/                 # Unit-Tests der puren Funktionen
│       ├── anilist.test.js    # AniList-Mapping + withFallback
│       ├── jikan.test.js      # Jikan-Mapping
│       ├── mediaStore.test.js # Media-Upsert-Pfade
│       └── sql.test.js        # parseIntParam
├── .dockerignore
├── .env.example
├── .gitignore
├── app.js                     # Express-App (ohne listen — testbar)
├── db.js                      # SQLite-Schema & Initialisierung
├── docker-compose.yml
├── Dockerfile                 # Multi-Stage Build
├── package.json
├── server.js                  # Einstiegspunkt (app.listen)
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
| `GET` | `/anime` | ✅ | Anime suchen (`?q=...&page=1`) |
| `GET` | `/manga` | ✅ | Manga suchen |
| `GET` | `/anime/:id` | ✅ | Anime-Details |
| `GET` | `/anime/:id/streaming` | ✅ | Streaming-Dienste für Anime |
| `GET` | `/manga/:id` | ✅ | Manga-Details |
| `GET` | `/top/anime` | ✅ | Top-Anime nach Bewertung |
| `GET` | `/top/manga` | ✅ | Top-Manga |
| `GET` | `/seasonal` | ✅ | Anime der aktuellen Saison |
| `GET` | `/movie` | ✅ | Filme suchen via TMDB (`?q=...&page=1`) |
| `GET` | `/tv` | ✅ | Serien suchen via TMDB |
| `GET` | `/movie/:id` | ✅ | Film-Details (TMDB-ID) |
| `GET` | `/tv/:id` | ✅ | Serien-Details (inkl. Episoden + Staffeln) |
| `GET` | `/top/movie` | ✅ | Beliebte Filme |
| `GET` | `/top/tv` | ✅ | Beliebte Serien |
| `GET` | `/trending` | ✅ | Trending der Woche (`?type=movie\|tv`) |

### Collections (`/api/collections`)
| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/` | ✅ | Eigene Collections (mit Anzahl + Cover-Vorschau) |
| `GET` | `/:id` | ✅ | Detail mit allen Items (typ-übergreifend) |
| `POST` | `/` | ✅ | Collection anlegen (`{ name, emoji? }`) |
| `PUT` | `/:id` | ✅ | Umbenennen |
| `DELETE` | `/:id` | ✅ | Löschen (Items bleiben in der Liste) |
| `POST` | `/:id/items` | ✅ | Eintrag hinzufügen (`{ listEntryId }`) |
| `DELETE` | `/:id/items/:entryId` | ✅ | Eintrag entfernen |

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
| `token_version` | INTEGER | Wird bei Passwortänderung erhöht → invalidiert alte JWTs |
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
| `owned` | INTEGER | 1 = physisch im Besitz |
| `owned_volumes` | INTEGER | Anzahl besessener Bände (nur Manga relevant) |
| `started_at` / `completed_at` / `updated_at` | DATETIME | |

> **UNIQUE-Constraint:** `(user_id, media_id)`.

### `collections`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INTEGER PK | |
| `user_id` | INTEGER FK | → `users.id` (CASCADE) |
| `name` | TEXT | z.B. „ReWatch" |
| `emoji` | TEXT | Optionales Symbol |

> **UNIQUE-Constraint:** `(user_id, name)`.

### `collection_items`
Verknüpft Collections mit Listen-Einträgen (Many-to-Many).

| Spalte | Typ | Beschreibung |
|---|---|---|
| `collection_id` | INTEGER FK | → `collections.id` (CASCADE) |
| `list_entry_id` | INTEGER FK | → `user_list.id` (CASCADE) |

> **UNIQUE-Constraint:** `(collection_id, list_entry_id)`. Wird ein Listen-Eintrag gelöscht, verschwindet er automatisch aus allen Collections.

### `user_follows`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `follower_id` | INTEGER FK | Wer folgt |
| `following_id` | INTEGER FK | Wem gefolgt wird |

---

## Standard-Admin

Beim ersten Start wird ein Admin-Konto angelegt, sofern `ADMIN_PASSWORD` gesetzt ist:

```bash
# Beispiel: Admin beim ersten Start anlegen
-e ADMIN_EMAIL=admin@aniga.local \
-e ADMIN_PASSWORD=MeinSicheresPasswort123
```

> ⚠️ **Ohne `ADMIN_PASSWORD` wird kein Admin-Konto angelegt.**
> Die Variablen werden nur ausgewertet, wenn noch kein Nutzer mit der angegebenen E-Mail existiert.

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
| 1.7 | Empfehlungen wechseln bei Klick auf "Neu laden" (Seiten 1–5) |
| 1.8 | Security-Refactoring: JWT_SECRET via Env-Var, Admin-Credentials via Env-Var, SQL-Feld-Whitelist bei Profil-Update, Input-Validierung aller Route-Parameter, CORS-Origin-Einschränkung, Admin-Selbstlöschung verhindert |
| 1.8 | Performance-Refactoring: DB-Indexes, Jikan-Rate-Limiter mit Queue + 8s Timeout, Such-Lock gegen Race Conditions, Empfehlungs-Abort bei Typwechsel |
| 1.8 | Code-Refactoring: `fmtAnime`/`fmtManga` → `formatMedia()`, SQL-Subqueries in `utils/sql.js`, Admin-Middleware als Komposition, `showTrackModal` aufgeteilt in 4 Funktionen, SW-Offline-Response mit Status 503, `defer`-Attribute für Scripts, ARIA-Labels für alle Modals |
| 1.9 | Physischer Besitz: Toggle „Physisch im Besitz" im Track-Modal, Bände-Zähler für Manga (y / x), Besitz-Badge auf Grid-Karten und Besitz-Chip in Listenansicht |
| 1.9 | AniList-Fallback: Bei Jikan/MAL-Ausfall springt AniList (GraphQL) automatisch ein — Suche, Details, Top, Seasonal und Empfehlungen bleiben verfügbar; `formatMedia()` nach `utils/jikan.js` extrahiert (DRY) |
| 1.9 | Security-Hardening: Rate-Limiting auf Login/Registrierung (10 Fehlversuche / 15 Min), Security-Header via `helmet` inkl. CSP, XSS-Fix in `coverImg()` (Inline-`onerror` → delegierter Listener, `esc()` escapt jetzt auch `'`), private Notizen nicht mehr über `GET /users/:id/list` einsehbar |
| 1.9 | Service Worker: Stale-While-Revalidate für statische Assets — Deploys kommen ohne manuellen Cache-Versions-Bump an; cross-origin Requests (Cover, Fonts) werden nicht mehr vom SW abgefangen |
| 1.9 | Token-Versionierung: Passwortänderung (Profil oder Admin-Reset) invalidiert alle bestehenden JWTs (`token_version`-Claim); die eigene Sitzung erhält automatisch einen frischen Token |
| 1.9 | Weitere Härtung & Refactoring: Search-Endpoints erfordern Login (kein offener API-Proxy mehr), Timing-Angleichung beim Login gegen E-Mail-Enumeration, Media-Upsert aus `routes/list.js` nach `utils/mediaStore.js` extrahiert, Migrations-Helper `addColumnIfMissing()` in `db.js` |
| 2.0 | Frontend-Modularisierung: `app.js`-Monolith (3160 Zeilen) in 18 ES-Module aufgeteilt (`views/`, `modals/`, `state.js`, `router.js`, …) — kein Framework, natives `<script type="module">`; Inline-`onclick`-Handler entfernt (CSP-kompatibel) |
| 2.0 | Testsuite: 30 Tests via eingebautem `node:test` (`npm test`, keine neue Dependency) — Unit-Tests für Jikan/AniList-Mapping, `withFallback`, Media-Upsert; Integrationstests für Auth (inkl. Token-Invalidierung), Listen-CRUD und Notes-Privacy; `server.js` in `app.js` (App) + `server.js` (listen) gesplittet für Testbarkeit |
| 2.1 | Collections: eigene Sammlungen (z.B. „ReWatch") mit Many-to-Many-Zuordnung — ein Eintrag kann in beliebig vielen Collections sein, typ-übergreifend; Chips im Track-Modal, eigener Nav-Punkt mit Cover-Mosaik, Collection-Filter in den Listen-Views, Schnell-Entfernen im Detail; `POST /list` liefert jetzt `entryId`; 8 neue Tests (38 gesamt) |
| 2.1 | Mobile UX: Bottom-Navigation auf 5 Kern-Items reduziert (Start, Suche, Anime, Manga, Mehr) — „Mehr" öffnet ein Bottom-Sheet mit Collections, Nutzer, Profil und Admin; Collection-Karten im Media-Card-Design mit adaptivem Cover-Mosaik (keine leeren Kacheln) |
| 2.2 | TMDB-Backend für Filme & Serien: `utils/tmdb.js` (deutsche Texte, beide Token-Formate, Genre-/Status-Mapping auf vorhandene Badges), Search-/Detail-/Top-/Trending-Endpoints, `user_list` akzeptiert `movie`/`tv`, Serien speichern Episoden + Staffeln; 5 neue Tests (43 gesamt). Frontend-Bereich folgt in Etappe 3 |
| 2.3 | Bereichs-Switcher „🌸 Anime & Manga \| 🎬 Filme & Serien" (Sidebar + Mehr-Sheet, persistiert): Navigation, Home-Dashboard, Suche (Trending + Beliebte), Empfehlungen (TMDB-Discover nach Genres), Listen-Views und Track-Modal sind bereichs-/typabhängig — Filme ohne Fortschritts-Inputs, Serien mit Episoden + Staffel-Chip; Nutzerlisten & Vergleich mit 4 Typ-Tabs; manuelle Einträge für Filme/Serien; Stats-Endpoint liefert alle 4 Typen; Modal-Speichern refresht Media-Metadaten (POST-Upsert statt PUT bei API-Einträgen) |

---

*Gebaut mit ❤️ und 🌸*
