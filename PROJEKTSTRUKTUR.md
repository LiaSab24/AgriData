# 📂 Projektstruktur: AgriData DWD

Diese Datei gibt einen Überblick über die Organisation des Quellcodes und die Verzeichnisstruktur der Applikation.

---

## 🏗 Verzeichnis-Baum

```text
.
├── config/                  # Konfigurationsdateien
│   └── app-config.ts        # Definition der DWD-Tasks (URLs, Cron-Intervalle)
├── data/                    # Speicherort für archivierte Rohdaten (ZIP/CSV)
├── logs/                    # System-Logdateien (download.log, image.log, error.log)
├── public/                  # Statische Dateien & Frontend-Assets
│   └── images/              # Archivierte DWD-Karten (.png)
├── src/                     # Frontend Quellcode (React)
│   ├── services/            # Geschäftslogik & API-Funktionen
│   │   ├── dataService.ts   # Logik für CDC ZIP-Downloads & Auto-Discovery
│   │   ├── imageService.ts  # Logik für Direkt-Downloads von DWD-Karten
│   │   ├── logger.ts        # Zentrales Logging-System (Filesystem & Dashboard)
│   │   └── scheduler.ts     # Task-Planung via node-cron
│   ├── App.tsx              # Dashboard-Oberfläche (Main Component)
│   ├── index.css            # Tailwind CSS & Global Styles
│   └── main.tsx             # React Entry Point
├── server.ts                # App-Backend (Express, API-Routen, Static Serving)
├── DOKUMENTATION.md         # Zusammenfassung der App-Features
├── README.md                # Installations- und Kurzanleitung
├── wetterdaten-skill.md     # Fachliche Erläuterungen zu den DWD-Daten
├── package.json             # Abhängigkeiten & Scripts
└── tsconfig.json            # TypeScript Konfiguration
```

---

## 📄 Dateibeschreibungen

### 1. Kern-System (Backend)
- **`server.ts`**: Der primäre Einstiegspunkt. Er startet den Express-Server, initialisiert den Scheduler, stellt die API für das Dashboard bereit und validiert Dateizugriffe (Löschen/Download).
- **`src/services/scheduler.ts`**: Nutzt `node-cron`, um die in der Konfiguration definierten Tasks zu den gewünschten Zeiten im Hintergrund auszuführen.

### 2. Services (Logik)
- **`imageService.ts`**: Spezialisiert auf den Download von Bilddaten. Prüft, ob URLs direkt ladbar sind oder ob ein Browser-Fallback benötigt wird.
- **`dataService.ts`**: Scant die DWD CDC Verzeichnisse nach den aktuellsten Datensätzen basierend auf Regex-Mustern und lädt diese herunter.
- **`logger.ts`**: Schreibt strukturierte JSON-Logs in das `/logs` Verzeichnis. Diese werden vom Backend gelesen und im Dashboard "live" angezeigt.

### 3. Frontend (UI)
- **`src/App.tsx`**: Beinhaltet das gesamte Dashboard-Layout (Dark-Mode, Glassmorphism). Verwaltet den State für Logs, Dateilisten und Status-Anzeigen.
- **`config/app-config.ts`**: Hier können neue DWD-Quellen einfach hinzugefügt werden, ohne den Code der Services ändern zu müssen.

### 4. Daten- & Log-Management
- **`/public/images`**: Hier werden die Bilder so gespeichert, dass sie über die URL `/images/...` direkt im Browser (oder Dashboard) angezeigt werden können.
- **`/data`**: Ein geschütztes Verzeichnis für Rohdaten, auf das nur über validierte API-Endpunkte zugegriffen werden kann.
- **`/logs`**: Beinhaltet die Logfiles, die rotierend vom Dashboard abgefragt werden.

---
*Stand: 14. Mai 2026*
