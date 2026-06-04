# Changelog – AgriData DWD

Protokoll der Änderungen pro Session. Format: Datum · Was wurde geändert · Warum.

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
