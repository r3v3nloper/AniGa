# AniGa 🌸

> **Anime, Manga, Filme, Serien & Spiele Tracker** — Eine selbst gehostete Progressive Web App zum Verfolgen deiner Listen.

[![Build & Push Docker Image](../../actions/workflows/docker.yml/badge.svg)](../../actions/workflows/docker.yml)
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
| 🎥 **Filme & Serien tracken** | Eigener Bereich mit Umschalter in der Sidebar — Serien mit **Staffel + Episode** (wie beim Streaming-Dienst angezeigt, z.B. „S12 · E5"), Filme ohne Fortschritt; Daten via TMDB (deutsch) |
| 🎮 **Spiele tracken** | Eigener Bereich „🎮 Spiele" — Status mit eigenen Bezeichnungen (**Am Spielen**, **Will spielen**, **Durchgespielt**, Pausiert, Abgebrochen), Bewertung, Notizen, Besitz; wie Filme **ohne Fortschrittszähler**; Daten via IGDB |
| ⏱️ **Spielzeit** | Eigene Spielzeit in Stunden erfassen (wird auf Karten und in der Listenansicht angezeigt) und daneben der **Durchschnitt bis zum Durchspielen** aus IGDB — sofern dort Daten vorliegen |
| 📦 **Physischer Besitz** | Pro Eintrag markieren, ob man ihn physisch besitzt; bei Manga inkl. Bände-Zähler (y / x); Badge auf den Karten |
| 🔍 **Suche** | Anime & Manga über Jikan (MyAnimeList) suchen, 20 Ergebnisse pro Seite; AniList als automatischer Fallback; Filme/Serien über TMDB, Spiele über IGDB |
| 📋 **Listen-Ansicht** | Statusfilter, Textfilter, Collection-Filter, Grid- oder Listenansicht |
| 📂 **Collections** | Eigene Sammlungen (z.B. „ReWatch") — ein Eintrag kann in beliebig vielen Collections sein, typ-übergreifend (Anime, Manga, Filme, Serien und Spiele gemischt); Zuordnung per Chips im Track-Modal |
| ✏️ **Manueller Eintrag** | Eigene Einträge ohne API-Verknüpfung anlegen — für alle fünf Medientypen |

### Entdecken & Empfehlungen
| Funktion | Beschreibung |
|---|---|
| 🏆 **Top-Listen** | Bestbewertete Anime/Manga, beliebte Filme/Serien und beliebte Spiele in der Suche |
| 🌸 **Saisonal** | Aktuell laufende Anime der Season |
| 🔥 **Trending** | Filme der Woche (TMDB) bzw. „Neu & angesagt" bei Spielen (IGDB, letzte 90 Tage) |
| ✨ **Empfehlungen** | Personalisierte Vorschläge basierend auf deinen meistgeschauten Genres (gewichtet nach Bewertung) — für alle fünf Medientypen |
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
| 📐 **Responsiv** | Sidebar-Layout auf Desktop (Bereichs-Switcher gestapelt); mobile Bottom-Navigation mit max. 5 Kern-Items + „Mehr"-Bottom-Sheet (Collections, Nutzer, Profil, Admin) |
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
- **[IGDB](https://api-docs.igdb.com/)** — Spiele (kostenlose Twitch-Developer-App nötig)
  - **Zweistufige Auth:** `IGDB_CLIENT_ID` + `IGDB_CLIENT_SECRET` in `.env`; daraus holt der
    Server selbstständig ein OAuth-Token (Client-Credentials, ~60 Tage gültig), cacht es im
    Speicher und erneuert es rechtzeitig. Bei einem 401 wird einmalig mit frischem Token wiederholt
  - Abfragen laufen als `POST` mit **Apicalypse**-Body (`fields …; search "…"; limit 20;`),
    nicht über Query-Parameter
  - Genre-Slugs werden auf deutsche Namen gemappt (IGDB liefert nur englische Bezeichnungen)
  - Wertung wird auf die App-Skala 0–10 normalisiert: Kritiker-Wertung vor kombinierter vor
    Nutzer-Wertung, jeweils `/10` (IGDB rechnet auf 0–100)
  - Die IGDB-ID wird im `mal_id`-Feld gespeichert, `source='igdb'` unterscheidet die Provider
  - Gesucht wird nur in eigenständig spielbaren Titeln (`game_type = (0,4,8,9,10)`:
    Hauptspiel, eigenständige Erweiterung, Remake, Remaster, erweitertes Spiel) — ohne
    diesen Filter stehen Mods, Bundles und DLC vor dem eigentlichen Spiel.
    **Hinweis:** das früher übliche Feld `category` liefert inzwischen durchgehend NULL
  - Empfehlungen sortieren nach Wertung, verlangen aber mindestens 300 Stimmen —
    sonst landen Titel mit 30 Bewertungen vor den Klassikern
  - Durchschnittliche Spieldauer kommt aus dem separaten Endpunkt `game_time_to_beats`
    (Werte in Sekunden, Feld `normally`) — er wird nur beim Detail-Abruf mitgeholt und
    ist optional: fehlt der Datensatz, bleibt das Feld leer
  - Rate Limit: 250 ms zwischen Anfragen (IGDB erlaubt 4/Sekunde), 8 s Timeout
  - Ohne konfigurierte Zugangsdaten liefern die Spiele-Endpoints 503

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
> - Der Container läuft als **non-root** (`USER node`, UID 1000). Das Datenverzeichnis muss
>   ihm gehören, sonst startet der Server mit der Meldung „Datenbank ist nicht beschreibbar".
>
>   **Bind-Mount** (`-v /srv/aniga/data:/data`) — es gelten die Rechte des Host-Verzeichnisses:
>   ```bash
>   sudo chown -R 1000:1000 /srv/aniga/data
>   ```
>   **Named Volume** (wie in `docker-compose.yml`) — nur ein *frisch angelegtes, leeres* Volume
>   übernimmt die Rechte aus dem Image. Ein Volume mit Daten aus der Zeit, als der Container
>   noch als root lief, bleibt `root:root` und muss einmalig übereignet werden:
>   ```bash
>   docker run --rm -v aniga-data:/data alpine chown -R 1000:1000 /data
>   ```

### Update (Synology / NAS)

Nach dem Hochladen neuer Dateien:

```bash
sh update.sh
```

Das Script führt `docker compose down && docker compose build --no-cache && docker compose up -d` aus.

---

## CI/CD (GitHub Actions)

> ⚠️ **Aktuell inaktiv:** `.gitignore` schließt `.github/workflows/` aus, der Workflow
> liegt also nur lokal und wird von GitHub nie ausgeführt. Damit die CI greift, muss
> der Eintrag aus `.gitignore` entfernt und `.github/workflows/docker.yml` eingecheckt
> werden — danach pusht jeder Commit auf `main` ein Image in die GHCR.

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
| `TRUST_PROXY` | Nein | — | Anzahl vertrauenswürdiger Proxy-Hops (z.B. `1` hinter nginx/Traefik/Synology-Reverse-Proxy). **Ohne diese Variable sehen hinter einem Proxy alle Clients wie eine einzige IP aus — das Login-Rate-Limit wird dann global und ein Angreifer kann alle Nutzer aussperren.** Nur setzen, wenn wirklich ein Proxy davorsteht: sonst lässt sich das Limit per gefälschtem `X-Forwarded-For` umgehen |
| `TMDB_API_TOKEN` | Nein | — | TMDB-Token für Filme & Serien (v4-Lesezugriffstoken oder v3-Schlüssel). Ohne Token liefern die Film/Serien-Endpoints 503 |
| `IGDB_CLIENT_ID` | Nein | — | Client-ID der Twitch-Developer-App (für IGDB/Spiele) |
| `IGDB_CLIENT_SECRET` | Nein | — | Client-Secret derselben App. Ohne beide Werte liefern die Spiele-Endpoints 503 |

`.env.example`:
```env
PORT=3000
JWT_SECRET=your-super-secret-key-change-this
ADMIN_EMAIL=admin@aniga.local
ADMIN_PASSWORD=MeinSicheresPasswort123
TMDB_API_TOKEN=eyJ...
IGDB_CLIENT_ID=...
IGDB_CLIENT_SECRET=...
TRUST_PROXY=1
```

> Die Anbieter-Zugangsdaten werden in `docker-compose.yml` durchgereicht (`TMDB_API_TOKEN`,
> `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`) und stammen aus der `.env` bzw. dem `--env-file`
> des Update-Scripts.
>
> **IGDB-Zugangsdaten anlegen:** auf [dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps)
> eine Anwendung registrieren (OAuth Redirect URL: `http://localhost`, Kategorie beliebig),
> danach Client-ID und Client-Secret übernehmen. Ein Twitch-Konto mit Zwei-Faktor-Authentifizierung
> ist Voraussetzung. Das eigentliche API-Token holt sich der Server damit selbst.

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
│   ├── css/                   # Dark Theme in Partials — Reihenfolge = Kaskade!
│   │   ├── base.css           # Variablen, Reset, Grundlayout
│   │   ├── shell.css          # Sidebar, Mobile-Header, Bottom-Nav, Breakpoints
│   │   ├── forms.css          # Auth-Ansicht, Formularfelder, Buttons
│   │   ├── layout.css         # Seitenkopf, Kennzahlen, Sektionen, Raster
│   │   ├── cards.css          # Medien-Karten, Collections, Bereichs-Switcher
│   │   ├── controls.css       # Status-Tabs, Filterleiste, Suche, Genre-Tags
│   │   ├── modal.css          # Modal, Detail-Ansicht, Streaming, Zahlenfelder
│   │   ├── feedback.css       # Toasts, Ladeanzeige, Leerzustände
│   │   └── views.css          # Profil, Admin, Nutzer, Vergleich, Empfehlungen
│   ├── icons/                 # App-Icons (192px, 512px, Logo)
│   ├── js/                    # Frontend als ES-Module (kein Framework)
│   │   ├── main.js            # Einstiegspunkt: Boot, App-Shell, Logout, PWA-Install
│   │   ├── api.js             # HTTP-Client (exportiert API-Objekt)
│   │   ├── state.js           # Zentraler App-State (S) — Defaults aus TYPE_META abgeleitet
│   │   ├── types.js           # Typ-Abstraktion: AREAS, TYPE_META, Status-Tabellen (Leaf-Modul)
│   │   ├── icons.js           # Inline-SVG-Icons (IC)
│   │   ├── dom.js             # DOM-Helfer, esc(), coverImg(), Toast
│   │   ├── modal.js           # Generisches Modal-Overlay
│   │   ├── media.js           # Medien-Helfer, Karten-Komponenten (re-exportiert types.js)
│   │   ├── shell.js           # Sidebar, Mobile-Header, Bottom-Nav
│   │   ├── router.js          # View-Navigation + Daten-Laden pro View
│   │   ├── views/             # Eine Datei pro Ansicht
│   │   │   ├── auth.js        # Login/Registrierung
│   │   │   ├── home.js        # Dashboard + Empfehlungen
│   │   │   ├── search.js      # Suche, Top-Listen, Seasonal
│   │   │   ├── lists.js       # Eigene Liste je Medientyp
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
│   ├── listRows.js            # Aufbereitung von user_list-Zeilen (Collections, JSON-Spalten)
│   ├── mediaTypes.js          # Erlaubte Medientypen (Backend-Whitelist)
│   ├── rateLimitedFetch.js    # Geteilte Request-Queue + Timeout für alle API-Clients
│   ├── igdb.js                # IGDB-Client für Spiele (OAuth-Token-Cache)
│   ├── sql.js                 # Wiederverwendbare SQL-Subqueries
│   └── tmdb.js                # TMDB-Client für Filme & Serien (de-DE)
├── tests/                     # Testsuite (node:test, keine Extra-Dependency)
│   ├── helpers/
│   │   └── setup.js           # Temp-DB + Testserver auf ephemerem Port
│   ├── public/
│   │   └── types.test.js      # Typ-Abstraktion des Frontends (ESM-Import in Node)
│   ├── routes/                # Integrationstests gegen die echte App
│   │   ├── app.test.js        # API-404 als JSON, Fehler-Handler, SPA-Fallback
│   │   ├── auth.test.js       # Register/Login/Token-Invalidierung
│   │   ├── recommendations.test.js # Genre-Gewichtung, 503, Limits (Provider gestubbt)
│   │   ├── search.test.js     # Provider-Routing, 503, Validierung (Provider gestubbt)
│   │   ├── collections.test.js# Collections-CRUD + Items
│   │   ├── list.test.js       # Listen-CRUD inkl. Besitz-Feldern und allen Typen
│   │   └── users.test.js      # Follow, Vergleich, Notes-Privacy-Regression
│   └── utils/                 # Unit-Tests der puren Funktionen
│       ├── anilist.test.js    # AniList-Mapping + withFallback
│       ├── jikan.test.js      # Jikan-Mapping
│       ├── listRows.test.js   # JSON-Spalten-Parsing + Rückfallwerte
│       ├── mediaStore.test.js # Media-Upsert-Pfade
│       ├── igdb.test.js       # IGDB-Mapping (Score-Normalisierung, Genres, Status)
│       ├── sql.test.js        # parseIntParam
│       └── tmdb.test.js       # TMDB-Mapping
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
| `GET` | `/game` | ✅ | Spiele suchen via IGDB (`?q=...&page=1`) |
| `GET` | `/game/:id` | ✅ | Spiel-Details (IGDB-ID, inkl. Beschreibung) |
| `GET` | `/top/game` | ✅ | Beliebte Spiele |
| `GET` | `/trending` | ✅ | Trending (`?type=movie\|tv\|game`) |

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
| `GET` | `/` | ✅ | Empfehlungen (`?type=anime\|manga\|movie\|tv\|game`) |

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
Zentrale Mediendatenbank (alle Typen aus Jikan/AniList, TMDB, IGDB oder manuell).

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INTEGER PK | |
| `mal_id` | INTEGER | Externe ID: MAL-, TMDB- oder IGDB-ID (NULL bei manuell) |
| `source` | TEXT | `jikan`, `tmdb`, `igdb` oder `manual` |
| `type` | TEXT | `anime`, `manga`, `movie`, `tv` oder `game` |
| `title` | TEXT | Haupttitel |
| `title_german` / `title_english` / `title_japanese` | TEXT | Weitere Titel |
| `image_url` | TEXT | Cover-Bild-URL |
| `synopsis` | TEXT | Beschreibung |
| `media_status` | TEXT | `Finished Airing`, `Currently Airing`, etc. |
| `episodes` / `chapters` / `volumes` | INTEGER | |
| `api_score` | REAL | MAL-Bewertung |
| `genres` | TEXT | JSON-Array als String |
| `year` / `season` | | Erscheinungsjahr/Saison |
| `avg_play_minutes` | INTEGER | Durchschnittliche Spieldauer in Minuten (nur Spiele, aus IGDB) |
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
| `current_episode` / `current_chapter` / `current_page` | INTEGER | Fortschritt (bei Serien: Episode **innerhalb** der Staffel) |
| `current_season` | INTEGER | Aktuelle Staffel (nur Serien) |
| `user_score` | REAL | Eigene Bewertung (0.5 – 5.0) |
| `notes` | TEXT | Eigene Notizen |
| `owned` | INTEGER | 1 = physisch im Besitz |
| `owned_volumes` | INTEGER | Anzahl besessener Bände (nur Manga relevant) |
| `play_minutes` | INTEGER | Eigene Spielzeit in Minuten (nur Spiele relevant) |
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
2. Die **Top 3 Genres** werden pro Anbieter übersetzt:
   - Anime/Manga → MAL-Genre-IDs, Jikan mit `?genres=X,Y,Z&order_by=score&sort=desc`
   - Filme/Serien → TMDB-Genre-IDs, `discover` mit `sort_by=vote_average.desc`
   - Spiele → IGDB-Genre-Slugs, `sort total_rating desc` mit mindestens 300 Wertungen
3. Bereits getrackte Titel werden herausgefiltert
4. Es werden maximal **12 Empfehlungen** zurückgegeben
5. **Fallback:** Hat der Nutzer noch keine Liste (oder greift kein Genre), werden die
   populärsten Titel des jeweiligen Typs angezeigt

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
| 2.5 | Spiele-Suche schärfer: nur noch eigenständig spielbare Titel (IGDB `game_type`) — vorher standen bei „breath of the wild" ein Mod und ein Bundle vor dem eigentlichen Spiel. Empfehlungen verlangen jetzt mindestens 300 Wertungen, dadurch Klassiker statt Nischentitel mit 30 Stimmen |
| 2.5 | **Spielzeit für Spiele**: eigene Spielzeit im Track-Modal in Stunden erfassen (gespeichert in Minuten als `user_list.play_minutes`), Anzeige auf Karten und in der Listenansicht („Spiel · 2017 · 42,5 Std"). Dazu die **Durchschnittsdauer bis zum Durchspielen** aus IGDBs `game_time_to_beats`-Endpunkt (`media_entries.avg_play_minutes`) als Chip im Modal plus Hinweis am Eingabefeld. Gesteuert über `TYPE_META.playtime` — andere Medientypen bleiben unberührt |
| 2.5 | Bugfix Deployment: Der Server startete auf einer **nicht beschreibbaren Datenbank** klaglos durch (Docker-Volume gehörte noch root aus der Zeit vor `USER node`) und scheiterte erst beim Speichern mit `SQLITE_READONLY` — `addColumnIfMissing()` hatte den Fehler per `catch {}` verschluckt. `db.js` prüft die Schreibbarkeit jetzt explizit beim Start und bricht mit klarer Anleitung ab. README-Korrektur: auch ein **Named Volume** braucht den einmaligen `chown`, wenn es Daten aus der Root-Zeit enthält — nur frisch angelegte, leere Volumes übernehmen die Rechte aus dem Image |
| 2.5 | **Spiele-Anbieter von RAWG auf IGDB gewechselt**: RAWG war über den gesamten Entwicklungszeitraum nicht erreichbar (Cloudflare 522, auch die Website selbst) und hat nie einen Datensatz geliefert — in der Datenbank stand kein einziger RAWG-Eintrag, der Wechsel war daher migrationsfrei. IGDB (Twitch/Amazon) braucht eine zweistufige Auth: `IGDB_CLIENT_ID` + `IGDB_CLIENT_SECRET` → OAuth-Token, das der Client cacht, rechtzeitig erneuert und bei 401 einmalig frisch holt. Abfragen laufen als POST mit Apicalypse-Body. Bewusst **kein** Fallback auf RAWG: anders als bei Jikan→AniList (gemeinsame MAL-ID) haben beide Spiele-Anbieter keinen gemeinsamen ID-Raum, ein Wechsel mitten im Betrieb würde Doppel-Einträge erzeugen |
| 2.5 | **Dritter Bereich „🎮 Spiele"**: Spiele-Client (`utils/igdb.js`) mit Rate-Limiter, 8 s Timeout, deutschen Genre-Namen und auf 0–10 normalisierter Wertung; Suche mit „Neu & angesagt"- und „Beliebte Spiele"-Sektion, genre-gewichtete Empfehlungen über RAWG-Discover, eigene Spiele-Liste, manuelle Einträge, Besitz und Collections (typ-übergreifend). Spiele werden wie Filme **ohne Fortschrittszähler** getrackt, die Stati heißen „Am Spielen / Will spielen / Durchgespielt / Pausiert / Abgebrochen" |
| 2.5 | Typ-Abstraktion refactored: `AREAS`/`TYPE_META`/Status-Tabellen nach `public/js/types.js` (importfreies Leaf-Modul) — `state.js` leitet alle Per-Typ-Defaults daraus ab (`S.lists`/`S.top`/`S.highlight` statt `animeList`/`topAnime`/…), `STATUS_LABELS` und die Badge-Map haben eine **Typ-Dimension** (`statusLabel(status, type)`), `progressText`/`progressPct`/`kindOf` lesen `TYPE_META.progress`, Such- und Home-View sind bereichs-generisch, Backend-Typ-Whitelist in `utils/mediaTypes.js`, TMDB-/RAWG-Routen teilen sich generische Provider-Handler |
| 2.5 | Tests & Aufräumen (Refactor Rank 14–18): Integrationstests für Suche und Empfehlungen mit gestubbten Providern (`stubProvider()` in den Test-Helfern; die Test-Umgebung leert die TMDB-/IGDB-Zugangsdaten, damit kein Test nach außen telefoniert) — geprüft werden Provider-Routing, 503-Pfade, Eingabe-Validierung, Seiten-Limits und die **Genre-Gewichtung** der Empfehlungen; `style.css` (2140 Zeilen) in 9 Partials zerlegt, per einzelnen `<link>`-Tags parallel geladen (Kaskade nachweislich unverändert); PWA-Metadaten und README-Badge aktualisiert; `/list/stats` braucht statt fünf Queries mit interpoliertem Spaltennamen nur noch eine; `renderEmptyState()` escapt selbst; tote API-Methoden entfernt; 15 neue Tests (79 gesamt) |
| 2.5 | Accessibility & Struktur (Refactor Rank 8–13): Profil, Nutzerkarten und Admin-Panel zeigen **alle fünf Medientypen** statt nur Anime/Manga (Zählspalten aus `MEDIA_TYPES` generiert, Profil-Blöcke pro Typ mit typgerechten Status-Labels); Modal mit `role="dialog"`, Fokus-Falle und Fokus-Rückgabe; alle Karten per Tastatur bedienbar (`role="button"`, Enter/Leertaste, sichtbarer Fokus-Ring); native `prompt()`/`confirm()` durch eigene Dialoge ersetzt (im offenen Track-Modal als Inline-Eingabe bzw. Inline-Bestätigung, da Modals sich bewusst nicht stapeln); `renderInto()`/`renderMain()`/`showSpinner()` ersetzen 39 lose Render-und-Bind-Paare; `renderTrackModalBody` von 183 auf 57 Zeilen zerlegt, Hero/Meta-Chips/Synopsis nach `media.js` geteilt (Info-Modal fremder Einträge nutzt sie mit) |
| 2.5 | Härtung & Aufräumen (Refactor Rank 1–7): `TRUST_PROXY` konfigurierbar — ohne diese Einstellung wäre das Login-Rate-Limit hinter einem Reverse-Proxy ein **globaler** Zähler gewesen; Container läuft als non-root (`USER node`); Zoom auf Mobilgeräten nicht mehr blockiert (WCAG 1.4.4); unbekannte `/api`-Pfade liefern JSON-404 statt der SPA-HTML-Seite, plus zentraler Fehler-Handler (kaputter JSON-Body → 400); Rate-Limiter-Queue aus 4 API-Clients nach `utils/rateLimitedFetch.js` extrahiert; Listen-Zeilen-Aufbereitung aus 3 Routen nach `utils/listRows.js`; Service-Worker cached nur noch die App-Shell vor (keine manuell gepflegte Dateiliste mehr); 7 neue Tests (64 gesamt) |
| 2.5 | Bereichs-Switcher gestapelt (3 Bereiche passen ohne Überlauf in die Sidebar), Typ-Tabs umbrechen bei 5 Typen; Suche zeigt bei Anbieter-Ausfall einen Hinweis statt Endlos-Spinner; 14 neue Tests (57 gesamt) |
| 2.4 | Staffel-Tracking für Serien: Eingabe als **Staffel + Episode innerhalb der Staffel** (wie bei Streaming-Diensten) statt absoluter Episodennummer — TMDB liefert Episodenzahlen pro Staffel (`seasons_data`), das Episoden-Maximum passt sich der gewählten Staffel an, „Abgeschlossen" springt auf letzte Staffel/Episode, Fortschrittsbalken rechnet absolut über alle Staffeln; Alt-Einträge mit absoluter Zählung werden beim Öffnen automatisch umgerechnet (`user_list.current_season`, `media_entries.seasons_data`) |

---

*Gebaut mit ❤️ und 🌸*
