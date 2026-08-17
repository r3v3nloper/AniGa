# AniGa — Anime, Manga, Filme, Serien & Spiele Tracker (PWA)

Node.js + Express + SQLite (better-sqlite3, synchron) Backend, Vanilla-JS-SPA als native ES-Module (kein Framework, kein Build-Schritt). Deutsche UI. Läuft auf `http://localhost:3000`.

## Kommandos

```bash
npm start        # Server (node server.js)
npm run dev      # mit nodemon
npm test         # node:test — 84 Tests, keine Extra-Dependencies
```

Dev-Server für Browser-Verifikation über `.claude/launch.json` (Name: "AniGa Server") starten, nie per Bash.

## Workflow-Regeln

- **NIEMALS `git commit`/`git push`** — der Nutzer macht alle Git-Operationen selbst.
- **Refactor vor Feature**: Betroffenen Code erst auf Verbesserungen prüfen, dann bauen.
- **README.md bei jedem Feature aktualisieren**: Funktionen-Tabelle, Changelog, API-Übersicht, DB-Schema.
- Tests für kritische Pfade sind Pflicht (AAA-Muster, echter Code statt Repliken).
- Nach Frontend-Änderungen im Browser verifizieren (Preview + zweimal neu laden, siehe Service-Worker-Gotcha).

## Architektur

### Backend
- `app.js` = Express-App (exportiert, ohne listen) / `server.js` = Einstiegspunkt. Trennung für Testbarkeit.
- `routes/`: auth, list, search, users, admin, recommendations, collections
- `utils/`: `jikan.js` (Anime/Manga, Rate-Limiter 450ms), `anilist.js` (GraphQL-**Fallback** via `withFallback()`, springt bei MAL-Ausfall ein), `tmdb.js` (Filme/Serien, de-DE, Token-Format-Autodetect), `igdb.js` (Spiele, OAuth-Token-Cache + Apicalypse-POST, Genre-Slugs→Deutsch, Score auf 0–10 normalisiert), `mediaStore.js` (media_entries-Upsert), `mediaTypes.js` (Typ-Whitelist), `listRows.js` (Zeilen-Aufbereitung), `rateLimitedFetch.js` (Queue+Timeout), `sql.js`
- **Alle vier API-Clients teilen sich `createRateLimitedFetch({ name, minInterval })`** — eigene Queue pro Client, kein handgeschriebener `pending`-Chain mehr.
- **Listen-Antworten immer über `utils/listRows.js`**: `prepareOwnListRows(rows, userId)` für die eigene Liste (Collections + JSON-Spalten), `parseJsonColumns(row)` für fremde Listen — Collections dürfen dort NICHT mit raus.
- `app.js`: `TRUST_PROXY` (Hop-Anzahl) muss hinter einem Reverse-Proxy gesetzt sein, sonst ist das Auth-Rate-Limit global. Unbekannte `/api`-Pfade werden vor dem SPA-Fallback als JSON-404 beantwortet; ein zentraler Error-Handler hält die JSON-Fehlerform.
- Externe IDs landen im `mal_id`-Feld, `source`-Spalte ('jikan'/'anilist'→als jikan/'tmdb'/'igdb'/'manual') unterscheidet. Lookup: `WHERE mal_id AND type`.
- Anbieter mit Zugangsdaten (TMDB, IGDB) laufen über generische Provider-Handler: `KEYED_PROVIDERS` in `routes/search.js`, `KEYED_RECOMMENDERS` in `routes/recommendations.js` — neuer Anbieter = ein Tabelleneintrag, keine neuen Handler.
- Auth: JWT mit `tv`-Claim (token_version) — Passwortänderung invalidiert alte Tokens. **Immer `signToken()` aus `middleware/auth.js`**, nie `jwt.sign` direkt. Login/Register haben Rate-Limiting (10 Fehlversuche/15 Min/IP — bei curl-Tests beachten!). Alle Search-Routen erfordern Auth.

### Frontend (`public/js/`, ES-Module)
- `main.js` (Boot, switchArea), `state.js` (zentrales `S`), `types.js` (Typ-Abstraktion), `api.js`, `dom.js`, `media.js`, `shell.js`, `router.js` (navigate), `views/*`, `modals/*`
- **Zirkuläre Imports sind OK, weil alles Funktionsdeklarationen sind (hoisted) und nichts zur Modul-Evaluationszeit aufgerufen wird — diese Regel strikt beibehalten!** Ausnahme: `types.js` ist bewusst ein **importfreies Leaf-Modul**, weil `state.js` seine Daten schon zur Evaluationszeit braucht — dort niemals etwas importieren.
- **Typ-Abstraktion in `types.js`** (von `media.js` re-exportiert, Views importieren weiter aus `media.js`) — bei neuen Medientypen NUR dort erweitern, keine Typ-Ternaries streuen:
  - `AREAS` (Bereiche für den Switcher, `S.area` in localStorage 'aniga_area'; Switcher ist gestapelt)
  - `TYPE_META` (view/label/short/singular/plural/emoji/icon + `progress` ('episodes'|'chapters'|null), `needsDetail`, `playtime`, `top`, `highlight`, `manualCounts`)
  - `statusLabel(status, type)` / `statusesFor(type)` / `defaultStatusFor` / `planStatusFor` — Stati sind typ-übergreifend gleich (watching/plan_to_watch/…), nur die **Beschriftung** hat eine Typ-Dimension (Spiele: „Am Spielen"/„Will spielen"/„Durchgespielt")
  - `mediaStatusMeta(status, type)` — Badge-Text pro Typ (Spiele: 'Finished' → „Erschienen")
- In `media.js`: `getUserList(type)`/`setUserList(type, list)` (→ `S.lists[type]`), `progressText/Pct`, `mediaSubtitle`, `absoluteEpisode`, `openEntryTrackModal(entry)` — **eigene Einträge immer hierüber öffnen** (lädt bei Serien ohne seasons_data die Details nach)
- `S` hält alle Per-Typ-Daten als Maps: `S.lists`, `S.top`, `S.highlight`, `S.listStatus/View/Filter/Collection` — in `state.js` über `perType()` aus `TYPE_META` erzeugt, nie manuell erweitern.
- Track-Modal (`modals/track.js`): `kindOf(type)` liest `TYPE_META.progress` → hasEpisodes/isTv/isManga steuert die Eingabefelder (Filme + Spiele bekommen keine).
- **Spielzeit** (`TYPE_META.playtime`, aktuell nur Spiele): Eingabe im Modal in **Stunden**, gespeichert werden **Minuten** (`user_list.play_minutes`). Der Anbieter-Durchschnitt (`media_entries.avg_play_minutes`) kommt aus IGDBs separatem `game_time_to_beats`-Endpunkt und wird nur im Detail-Abruf gefüllt — deshalb steht er in `updateApiData()` unter `COALESCE`, sonst würde ihn ein Speichern aus der Suche wieder löschen. Formatierung überall über `playtimeText(minutes)` aus media.js.
- Mobile Bottom-Nav: max. 5 Items; sekundäre Views hinter dem „Mehr"-Sheet (`MORE_VIEWS` in shell.js).
- **Rendern immer über `renderInto(el, html, bind)` / `renderMain(html, bind)` / `showSpinner()`** (dom.js) — nie `innerHTML = …` gefolgt von einem separaten Bind-Aufruf.
- **Klickbare Nicht-Buttons über `bindActivate(el, handler)`** (dom.js) — setzt `role="button"` + `tabindex` und behandelt Enter/Leertaste. Dekorative Buttons *innerhalb* solcher Karten brauchen `tabindex="-1" aria-hidden="true"`.
- **Keine nativen `prompt()`/`confirm()`** — `confirmModal()`/`promptModal()` aus modal.js nutzen. **Modals stapeln sich nicht:** aus einem offenen Modal heraus stattdessen inline lösen (siehe Collection-Eingabe und Löschbestätigung in `modals/track.js`).
- Geteilte Detail-Bausteine in media.js: `mediaHeroHtml`, `mediaMetaChipsHtml`, `genreTagsHtml`, `synopsisHtml` + `bindSynopsisToggle` — von Track-Modal und Nutzer-Info-Modal gemeinsam genutzt.
- Nutzer-Zählungen: `TYPE_COUNT_COLUMNS` (utils/sql.js) liefert `<typ>Count` je Medientyp, im Frontend über `typeCountsText(user)` formatiert.
- **CSS liegt in 9 Partials** (`public/css/*.css`), eingebunden über einzelne `<link>`-Tags in `index.html`. **Die Reihenfolge dort ist die Kaskade** — neue Regeln in die thematisch passende Datei, nicht ans Ende irgendeiner.
- `renderEmptyState(emoji, title, msg, btn)` escapt emoji/title/msg selbst; nur `btn` ist rohes HTML.

## Kritische Gotchas

1. **Service Worker + CSP**: helmet setzt CSP auch auf die sw.js-Response → SW-`fetch()` unterliegt der SW-eigenen `connect-src`. Deshalb fängt der SW cross-origin Requests NICHT ab (early return). `STATIC` enthält nur noch die App-Shell — neue JS-Dateien müssen dort **nicht** mehr eingetragen werden (Stale-While-Revalidate cached sie zur Laufzeit); bei Shell-Änderungen `CACHE`-Version bumpen. **Frontend-Änderungen kommen erst beim ZWEITEN Reload an.**
2. **POST /list = Full-Replace** (Track-Modal sendet alle Felder, refresht auch Media-Metadaten via Upsert), **PUT /list/:id = COALESCE-Teilupdate**. Modal-Save nutzt POST — außer bei manuellen Einträgen (PUT, sonst Duplikat-Zeilen, da `is_manual` immer neu inserted).
3. **TMDB-/IGDB-Suchergebnisse sind unvollständig** (keine Episoden/Staffeln bzw. keine Beschreibung) — Typen mit `TYPE_META.needsDetail` holen vor dem Modal immer `getDetail` (macht `bindMediaCard` bereits).
4. **Serien-Staffel-Tracking**: `user_list.current_episode` ist bei `tv` die Episode INNERHALB der Staffel (`current_season`); `media_entries.seasons_data` = JSON `[{season, episodes}]`. Absolute Berechnung über `absoluteEpisode()`.
5. DB-Migrationen: `addColumnIfMissing()` in `db.js` (idempotent, läuft beim Start). **Achtung:** dessen `catch {}` schluckt jeden Fehler — deshalb prüft `initAndAssertWritable()` davor explizit die Schreibbarkeit und beendet den Prozess mit klarer Meldung. Ohne diese Prüfung startet der Server auf einer nur lesbaren DB (Docker: Volume gehört root) scheinbar normal und scheitert erst beim ersten Speichern mit `SQLITE_READONLY`.
6. Tests: `tests/helpers/setup.js` MUSS erste require jeder Testdatei sein (Temp-DB + JWT_SECRET vor db-Load). Jede Testdatei läuft in eigenem Prozess. Das Setup leert `TMDB_API_TOKEN`/`IGDB_CLIENT_ID`/`IGDB_CLIENT_SECRET` (dotenv überschreibt gesetzte Werte nicht) — Tests telefonieren nie nach außen. Provider für Erfolgspfade mit `stubProvider(mod, {…})` ersetzen; das geht nur, weil `routes/search.js` und `routes/recommendations.js` zur **Aufrufzeit** auf das Modul-Objekt zugreifen. Der Jikan-Pfad destrukturiert beim Laden und ist daher nicht stubbar.
7. Secrets (`JWT_SECRET`, `TMDB_API_TOKEN`, `IGDB_CLIENT_ID`/`IGDB_CLIENT_SECRET`, …) nur via `.env` (gitignored + dockerignored) — nie loggen, nie committen, nie in Chat-Beispiele.
8. Tests für Frontend-Logik gehen nur bei importfreien Modulen (`tests/public/types.test.js` lädt `public/js/types.js` per dynamischem `import()` mit `pathToFileURL` — auf Windows Pflicht).

## DB-Kurzreferenz

`users` (token_version!) · `media_entries` (UNIQUE mal_id+type+source, seasons_data) · `user_list` (UNIQUE user_id+media_id; owned, owned_volumes, current_season) · `collections` + `collection_items` (Many-to-Many auf user_list.id, CASCADE) · `user_follows`

## Deployment

Docker (Debian-Server des Nutzers, eigenes Update-Script mit `--env-file`). `docker-compose.yml` + `update.sh` liegen im Repo (Synology-Variante). `TMDB_API_TOKEN`, `IGDB_CLIENT_ID` und `IGDB_CLIENT_SECRET` werden in `docker-compose.yml` durchgereicht. Env-Vars: siehe README „Umgebungsvariablen".
