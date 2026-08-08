# Changelog – AgriData DWD

Protokoll der Änderungen pro Session. Format: Datum · Was wurde geändert · Warum.

---

## Session 08.08.2026 (Fortsetzung — erste Änderungen in `AgriData`)

### `chore`: Repository-Abspaltung von `AgriDataDWD` nach `AgriData`

- **Was:** Dieses öffentliche Repository (`LiaSab24/AgriData`) ist ein
  vollständiger Klon von `LiaSab24/AgriDataDWD` inklusive der kompletten
  Historie bis Commit `2286e8f`. Ab hier laufen beide getrennt weiter.
- **Warum:** `AgriDataDWD` bleibt privat und unverändert als lauffähige
  Server-Version (Express + `node-cron`, bisher auf Railway). `AgriData` wird
  die serverlose Variante: Abruf per GitHub Actions, Archiv im Repository,
  Auslieferung statisch. Zwei getrennte Repos, weil noch offen ist, in welche
  Richtung die App sich entwickelt — die alte Version bleibt so als
  Rückfalloption erhalten.
- **Warum öffentlich:** GitHub Actions hat in öffentlichen Repos unbegrenzte
  Minuten (privat: 2.000/Monat), GitHub Pages ist für private Repos nur mit
  einem Pro-Plan verfügbar, und die archivierten DWD-Karten sind ohnehin frei
  zugängliche Daten. Damit entfällt der Bedarf an einem externen Hoster
  (Netlify/Cloudflare) vollständig.
- **Vor der Veröffentlichung geprüft:** `.env` war nie committet; die gesamte
  Historie enthält keine echten Secrets (nur Dokumentation *über* Tokens und
  den Platzhalter `CHANGE_ME_…`); `data/` und `logs/` enthalten nur
  `.gitkeep`; keine personenbezogenen Daten in den 26 getrackten Dateien;
  Commit-Autor ist durchgehend die `users.noreply.github.com`-Adresse.

### `build`: `playwright-chromium` entfernen

- **Was:** Dependency deinstalliert und der Browser-Fallback in
  `src/services/imageService.ts` entfernt. Nicht-Bild-URLs werfen jetzt einen
  expliziten Fehler statt still einen Screenshot zu versuchen.
- **Warum:** Der Pfad war toter Code. Alle fünf Tasks in
  `config/app-config.ts` sind direkte `.png`-URLs, und der Direkt-Download
  weigert sich ausdrücklich, für Bilder auf den Browser zurückzufallen
  („should probably not fall back to browser screenshots of error pages“) —
  `chromium.launch()` wurde also nie erreicht. Das Paket stand zudem in
  `dependencies`, nicht in `devDependencies`, und wäre in jeder Produktions-
  und CI-Installation mitgezogen worden.
- **Stolperstein:** Das npm-Paket selbst ist nur 44 KB — die Kosten stecken im
  Install-Skript, das die Chromium-Binaries nachlädt (lokaler Cache unter
  `~/Library/Caches/ms-playwright`: 907 MB). Lokal fiel das bisher nicht auf,
  weil npm die Install-Skripte per `allowScripts` blockiert hatte. In GitHub
  Actions, wo Skripte normal laufen, hätte jeder tägliche Lauf diesen
  Download ausgelöst.
- **Verifiziert:** `tsc --noEmit` fehlerfrei, `npm run build` grün,
  `npm audit` 0 Vulnerabilities. `node_modules` von 240 MB auf 209 MB.
  Keine Referenz auf `playwright`/`chromium` mehr im Code außer dem
  erklärenden Kommentar.
- **Rückweg:** Falls später eine DWD-*Seite* statt eines direkten Bildlinks
  abgegriffen werden soll, ist `playwright-chromium` als **devDependency**
  wieder aufzunehmen und der `chromium.launch()`-Block aus der Historie
  zurückzuholen; der Kommentar in `imageService.ts:69` verweist darauf.
- **Nicht angefasst:** `CONFIG.settings.headless` und
  `CONFIG.settings.resolution` in `config/app-config.ts` werden dadurch nicht
  mehr gelesen. Bewusst stehen gelassen, um die Änderung klein zu halten.

---

## Session 08.08.2026

### `build`: Google Fonts durch self-hosted `@fontsource-variable` ersetzen

- **Was:** Inter, Outfit und JetBrains Mono werden nicht mehr per `@import` von
  `fonts.googleapis.com` geladen, sondern als Variable Fonts lokal gebündelt.
  Dazu `@fontsource-variable/{inter,outfit,jetbrains-mono}` installiert und in
  `src/main.tsx` importiert; Vite bündelt die WOFF2-Dateien mit.
  Die `@theme`-Variablen in `src/index.css` zeigen nun auf die
  Fontsource-Familiennamen („Inter Variable“ usw.), die alten Namen bleiben
  als Fallback stehen.
- **Warum:** Kein externer Font-Request mehr beim Seitenaufruf — keine
  Abhängigkeit von der Erreichbarkeit von Google und keine Drittanbieter-Verbindung.
  Alle drei Familien sind OFL-lizenziert, Self-Hosting ist zulässig.
- **Stolperstein:** Fontsource registriert die Familien mit dem Suffix
  „Variable“. Ohne Anpassung des `@theme`-Blocks wären alle drei Schriften
  still auf System-Fonts zurückgefallen — ohne Fehlermeldung.
- **Verifiziert:** Build grün; im Headless-Browser 0 Console-Fehler,
  0 fehlgeschlagene Requests, keine Anfrage an `googleapis`/`gstatic`.
  Inter (`body`), Outfit (`h1`) und JetBrains Mono (Log-Zeilen) rendern
  laut Computed-Styles nachweislich. Es werden nur die Latin-Subsets geladen,
  die `unicode-range`-Mechanik greift.
- **Betroffen:** `package.json`, `package-lock.json`, `src/index.css`, `src/main.tsx`.

### `chore`: fehlende TypeScript-Typpakete ergänzen

- **Was:** `@types/react`, `@types/react-dom` und `@types/fs-extra` als
  devDependencies ergänzt.
- **Warum:** Die IDE meldete `TS7016` auf allen React-Importen in `src/main.tsx`
  und `src/App.tsx` sowie auf `fs-extra` in `server.ts`; React 19 bringt keine
  eigenen Typen mit. `npm run lint` blieb dabei still, weil `tsconfig.json`
  weder `strict` noch `noImplicitAny` setzt und `TS7016` nur unter
  `noImplicitAny` feuert — die IDE prüfte also strenger als das npm-Script.
- **Verifiziert:** `tsc --noEmit` und `tsc --noEmit --noImplicitAny` beide
  fehlerfrei, IDE-Diagnostics auf 0. In `App.tsx` kamen keine bislang von
  `any` verdeckten Typfehler zum Vorschein.

### `chore`: `.gitignore` um maschinenlokale und Editor-Artefakte erweitern

- **Was:** Ergänzt wurden `.claude/settings.local.json`, macOS-Beiwerk
  (`._*`, `.Spotlight-V100`, `.Trashes`), Editor-Dateien (`.vscode/*` mit
  Ausnahme von `extensions.json`, `.idea/`, `*.swp`) und Tool-Caches
  (`*.tsbuildinfo`, `.eslintcache`, `.npm`, `dist-ssr`, `*.local`).
- **Warum:** `.claude/settings.local.json` war die einzige real vorhandene
  Lücke — sie enthält eine persönliche Permission-Allowlist mit absoluten
  Pfaden. `.claude/settings.json`, `skills/` und `agents/` bleiben bewusst
  committbar. `._*` ist hier besonders relevant, weil das Projektverzeichnis
  als Kopie über Datenträger wandern kann; `.DS_Store` allein fängt
  AppleDouble-Dateien nicht ab.
- **Verifiziert:** Mit echten Testdateien im Arbeitsbaum geprüft (danach
  wieder entfernt). `git status` meldet seither keine untracked-und-nicht-
  ignorierten Dateien mehr, und die Negation für `.vscode/extensions.json`
  greift korrekt.

### `docs`: Leerzeilen nach Überschriften in `README.md`

- **Was:** Markdown-Formatierung — nach jeder Überschrift eine Leerzeile.
- **Warum:** Reine Formatierung, kein inhaltlicher Unterschied.

### `chore(deps)`: alle 11 Sicherheitslücken schließen (0 Vulnerabilities)

- **Was:** `npm audit fix` **ohne** `--force` ausgeführt, danach zusätzlich
  `npm update tsx`. Angehoben wurden `axios` → 1.19.0, `vite` → 6.4.3,
  `postcss` → 8.5.26, `protobufjs` → 7.6.5, `nanoid` → 3.3.18, `ws` → 8.21.3,
  `form-data` → 4.0.6, `brace-expansion` → 2.1.4, `tsx` → 4.23.11
  (zieht `esbuild` → 0.28.1) sowie `body-parser` und `@babel/core`.
- **Warum:** Löst den in der vorigen Session als „noch offen“ notierten Punkt:
  11 Schwachstellen (3 low, 8 high), alle transitiv. Schwerpunkt waren zehn
  `axios`-Advisories (Prototype Pollution, DoS, `maxBodyLength`-Bypass) und
  Path Traversal in `postcss` beim Auto-Laden von Source Maps.
- **Stolperstein:** `npm audit fix` allein wurde nicht fertig — der letzte
  Befund (`esbuild` unterhalb von `tsx`) blieb stehen, obwohl npm
  „fix available“ meldete; wiederholte Läufe änderten nichts. `--force` wäre
  dafür trotzdem falsch gewesen: `tsx` stand auf `^4.21.0`, das aktuelle
  4.23.11 lag längst innerhalb dieses Bereichs. Ein schlichtes
  `npm update tsx` genügte. `npm audit fix` ist bei verschachtelten
  Transitiv-Abhängigkeiten also nicht vollständig — der Rest lohnt eine
  manuelle Prüfung, bevor man zu `--force` greift.
- **Verifiziert:** `npm audit` meldet **0 Vulnerabilities**. `npm run lint`
  (`tsc --noEmit`) fehlerfrei, `npm run build` grün (Vite: 2075 Module +
  esbuild-Server-Bundle), `npx tsx --version` → 4.23.11 lauffähig.
  `package.json` blieb **unverändert** — ausschließlich semver-kompatible
  Updates, keine Breaking Changes. Die Build-Artefakte haben identische
  Hashes wie vor dem Update (`index-B5fZos3B.js`, `index-0LW27zzw.css`),
  der ausgelieferte Bundle-Inhalt ist also nachweislich derselbe.
- **Betroffen:** nur `package-lock.json`.

### `chore`: lokale `.env` mit `VITE_API_TOKEN` anlegen

- **Was:** `.env` im Projektwurzelverzeichnis angelegt, mit einem per
  `openssl rand -hex 32` erzeugten Token und Dateirechten `600`.
  Bewusst **nur** diese eine Variable — nicht `.env.example` komplett kopiert.
  Nicht im Repository (durch `.gitignore` → `.env*` abgedeckt); dieser
  Eintrag dokumentiert lediglich den Einrichtungsschritt.
- **Warum:** `npm run dev` gab bei jedem Start
  `[SECURITY] VITE_API_TOKEN ist nicht gesetzt` aus, und die schreibenden
  Endpunkte (`DELETE /api/logs/:type`, `DELETE /api/files`,
  `POST /api/tasks/*`) antworteten fail-secure mit 503 — lokal also gar nicht
  auslösbar.
- **Stolperstein:** `.env.example` enthält neben dem Token auch Cron-Werte
  (`BF_SCHLUF_CRON="0 16 * * *"` usw.), die von den aktiven Code-Defaults
  abweichen (Scheduler läuft mit `30 16 * * *`). Ein vollständiges Kopieren
  der Beispieldatei hätte die Zeitpläne still verstellt.
- **Verifiziert:** Startlog ohne `[SECURITY]`-Warnung. Auth-Matrix gegen
  `DELETE /api/logs/errors`: ohne Token 401, falscher Token 401,
  `x-api-token` 200, `Authorization: Bearer` 200 — die 503-Antwort ist damit
  weg. Frontend lädt mit 0 Konsolenfehlern und 0 fehlgeschlagenen Requests.
- **Offener Punkt (Sicherheit):** Es wurde nachgewiesen, dass der Token durch
  den `VITE_`-Prefix im ausgelieferten Client-Modul steht — im dev-Server
  ist er im transformierten `src/App.tsx` im Klartext auffindbar. Gegenüber
  jemandem, der das Dashboard im Browser öffnet, ist er damit kein Geheimnis;
  er verhindert nur den blinden API-Zugriff ohne Dashboard. Lokal
  unproblematisch, auf dem öffentlichen Railway-Deployment bedeutet es aber,
  dass Löschen und Task-Auslösen für jeden Seitenbesucher möglich sind.
  Ein echter Schutz bräuchte serverseitige Sessions oder eine
  vorgelagerte Zugriffssperre für das Dashboard. **Nicht geändert.**
- **Deployment-Hinweis:** `.env` wird nicht deployt — auf Railway muss
  `VITE_API_TOKEN` separat als Umgebungsvariable gesetzt werden.

### Hinweise (ohne Code-Änderung)

- Die Warnungen bei `npm i` (`npm warn allow-scripts`, Funding-Hinweis,
  Audit-Zusammenfassung) stammen sämtlich aus Bestandsabhängigkeiten
  (`esbuild`, `playwright-chromium`, `protobufjs`, `fsevents`, `@google/genai`)
  und haben keinen Bezug zu den Font-Paketen — diese haben `scripts: {}`.
  esbuild-Binary und Playwright-Browser sind vorhanden, der Build läuft.
- `npm audit` meldete zunächst **11 Schwachstellen (3 low, 8 high)** in
  `postcss`, `protobufjs`, `vite` und `ws`. Alle transitiv, keine davon neu
  hinzugekommen. **Erledigt** — siehe `chore(deps)` weiter oben in dieser Session.
- Geprüft und unbedenklich: `vite.config.ts` bettet `GEMINI_API_KEY` per
  `define` ein, aber kein Client-Code referenziert ihn und im gebauten Bundle
  taucht er nicht auf. `VITE_API_TOKEN` landet bewusst im Bundle
  (so dokumentiert in `src/App.tsx`), der echte Wert bleibt über `.env*`
  aus der Versionskontrolle heraus. Zur Tragweite dieser Einbettung siehe
  `chore`: lokale `.env` weiter oben in dieser Session.

---

## Session 04.06.2026

- Keine Code-Änderungen am Repository.
- Erstellung dieses Änderungsprotokolls (`CHANGELOG.md`).

---

## Session 03.06.2026

### `fix(dwd)`: BF-Bodenfeuchte-Muster an neue DWD-Struktur anpassen

- **Was:** Regex für die Bodenfeuchte-Dateien in `src/services/dataService.ts` aktualisiert.
- **Warum:** Der DWD stellt unter `derived_germany/soil/daily/recent/` keine
  gebündelte `tageswerte_BF_*_akt.zip` mehr bereit, sondern pro Station gzippte
  Textdateien (`derived_germany_soil_daily_recent_v2_<STATION>.txt.gz`).
  Behebt den Fehler „No files matching ...akt.zip“.
  Gegen das Live-Verzeichnis verifiziert (493 Treffer, Download HTTP 200).

### `fix`: Browser-Tab-Titel auf „AgriData DWD Monitor“ setzen

- **Was:** Titel in `index.html` korrigiert.
- **Warum:** Im committeten Stand war noch der Platzhalter
  „My Google AI Studio App“ aktiv, der auch auf Railway deployt wurde.

### `build`: dist/ vor jedem Build bereinigen

- **Was:** Der Build-Schritt in `package.json` führt nun zuerst `npm run clean` aus.
- **Warum:** Verhindert das Deployen eines gecachten/veralteten `dist/`-Verzeichnisses.
  Behebt das Symptom, dass ein alter Build `process.env.PORT`
  (z. B. 8080 auf Cloud Run) ignorierte.

### `fix`: PORT aus `process.env.PORT` lesen (Railway-Kompatibilität)

- **Was:** `server.ts` liest den Port nun aus der Umgebungsvariable (Fallback 3000).
- **Warum:** Railway gibt den Port via Umgebungsvariable vor; der hart verdrahtete
  Port 3000 führte zu fehlschlagenden Health-Checks bzw. nicht erreichbarem Service.

### `feat`: API-Token-Schutz, ZIP-Download für Bilder, Lint-Fixes

- **Was:**
  - Auth-Middleware (`x-api-token` / Bearer) für Lösch- und Task-Endpunkte
    mit konstant-zeitigem Vergleich und Fail-secure-Verhalten ohne konfigurierten Token.
  - `VITE_API_TOKEN` in `.env.example` dokumentiert; Frontend sendet Token-Header.
  - `src/vite-env.d.ts` zur Typisierung von `import.meta.env` ergänzt.
  - Offener Endpunkt `GET /api/images/zip` + Dashboard-Button (kein Token nötig).
  - `archiver`-Dependency ergänzt.
  - `parseInt` → `Number.parseInt` in `config/app-config.ts` (Lint).
- **Warum:** Schutz sensibler Endpunkte, einfacher Bilder-Export und sauberer Code.
- **Betroffen:** `.env.example`, `config/app-config.ts`, `package.json`,
  `package-lock.json`, `server.ts`, `src/App.tsx`, `src/vite-env.d.ts`.

---

## Session 02.06.2026

### Initial commit: AgriData DWD v2.0 mit Bugfixes

Erstes Einchecken des Projekts (Versionsstand v2.0) inklusive Setup und mehrerer
grundlegender Bugfixes. Umfang: 24 Dateien, ~6.200 Zeilen.

#### Installation & Projekt-Setup

- **Was:** Initiale Projektstruktur angelegt: `package.json` / `package-lock.json`
  (Dependencies installiert), Vite-Konfiguration (`vite.config.ts`),
  TypeScript-Setup (`tsconfig.json`), Frontend-Einstieg (`index.html`,
  `src/main.tsx`, `src/App.tsx`, `src/index.css`), Backend (`server.ts`),
  Services (`dataService`, `imageService`, `logger`, `scheduler`),
  Konfiguration (`config/app-config.ts`), `.env.example`, `.gitignore`
  sowie Dokumentation (`README.md`, `DOKUMENTATION.md`, `PROJEKTSTRUKTUR.md`,
  `wetterdaten-skill.md`).
- **Warum:** Grundgerüst für das DWD-Daten-Monitoring lauffähig machen.

#### `fix(dataService)`: korrupte Teildateien entfernen

- **Was:** Unvollständige Teildateien werden bei Stream-Fehlern wieder gelöscht.
- **Warum:** Bei abgebrochenen Downloads blieben korrupte/halbe Dateien liegen,
  die nachgelagerte Verarbeitung störten.

#### `fix(config)`: Cron-Zeiten korrigiert

- **Was:** Tageslauf auf 16:30 gesetzt, Monats-Sync auf `0 17 1 * *`.
- **Warum:** Falsche/ungünstige Ausführungszeiten korrigiert, damit die Jobs
  verlässlich zur gewünschten Zeit laufen.

#### `fix(logger)`: explizites Log-Routing

- **Was:** Explizites Routing eingeführt; System-Logs landen in `system.log`
  und in einem eigenen UI-Tab.
- **Warum:** Saubere Trennung der Log-Ströme und bessere Nachvollziehbarkeit im UI.

#### `fix(server)`: Path-Traversal beim Löschen abgesichert

- **Was:** Löschpfade werden via `path.relative` validiert.
- **Warum:** Verhindert Path-Traversal-Angriffe (Löschen von Dateien außerhalb
  des erlaubten Verzeichnisses).

#### `feat(imageService)`: Retry-Logik & längeres Timeout

- **Was:** Wiederholungslogik (`retryCount`) ergänzt, Timeout von 45 s auf 90 s erhöht.
- **Warum:** Robustheit bei langsamen/instabilen Bild-Downloads erhöhen.

#### `chore`: npm audit fix & .gitignore

- **Was:** `npm audit fix` ausgeführt (0 Vulnerabilities); Runtime-Artefakte
  in `.gitignore` aufgenommen.
- **Warum:** Sicherheitslücken in Abhängigkeiten schließen und generierte
  Laufzeitdateien aus der Versionskontrolle heraushalten.
