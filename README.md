# AgriData DWD v2.0 - Präzisions-Agrar-Wetterdaten

Ein hochspezialisiertes Monitoring-System zur automatisierten Erfassung und Archivierung von Bodenfeuchte- und Bodentemperaturdaten des Deutschen Wetterdienstes (DWD).

## 🚀 Features
- **Präzisions-Monitoring**: Spezifische Erfassung für verschiedene Bodentypen (lehmiger Schluf vs. lehmiger Sand).
- **Regionale Daten**: Fokus auf Schleswig-Holstein (Station Ostenfeld/Rendsburg).
- **Automatisierte Erfassung**: Archivierung der DWD-Bilder (Images) via Direkt-Schnittstelle.
- **Archiv-Management**: Dateien einsehen, herunterladen oder direkt im Dashboard löschen.
- **Entwickelt für Agrar-Profis**: Modernes Dashboard mit Live-Status und detaillierten Prozess-Protokollen.

## 📊 Aktuelle Tracking-Tasks
Das System überwacht folgende Datenquellen automatisch:
- **Bodenfeuchte (Schluf/Schwer)**: Image-Direkt-Download täglich (16:30)
- **Bodenfeuchte (Sand/Leicht)**: Image-Direkt-Download täglich (16:30)
- **Bodentemperatur (DE 5cm)**: Image-Direkt-Download alle 5 Tage (16:00)
- **Regionale Bodenwerte (SH)**: Image-Direkt-Download alle 10 Tage (16:00)
- **DWD OpenData Rohdaten (ZIP)**: Monatlich (1. des Monats, 17:00). Automatisiertes Monitoring der CDC (Climate Data Center) Archive. Erfasst werden die `tageswerte_BF_*` (Bodenfeuchte) und `tageswerte_EB_*` (Bodentemperatur) ZIP-Archive. Diese Daten dienen der detaillierten Langzeitanalyse.

## 📱 App-Installation (Verknüpfung erstellen)
Da die App über das Web aufgerufen wird, können Sie sie für einen schnelleren Zugriff wie eine normale App auf Ihrem Gerät "installieren":

### Auf dem Smartphone (iOS / Android)
1. Öffnen Sie die App im Browser (Safari für iPhone, Chrome für Android).
2. **iPhone (Safari)**: Tippen Sie unten auf das **Teilen-Symbol** (Quadrat mit Pfeil nach oben) und wählen Sie **"Zum Home-Bildschirm"**.
3. **Android (Chrome)**: Tippen Sie oben rechts auf die **drei Punkte** und wählen Sie **"Zum Startbildschirm hinzufügen"**.

### Auf dem Computer (Windows / Mac)
1. Öffnen Sie die App in Google Chrome oder Microsoft Edge.
2. Klicken Sie oben rechts auf die **drei Punkte**.
3. Wählen Sie **"Speichern und teilen"** -> **"Seite als App installieren"** oder **"Verknüpfung erstellen"**.

## 🛠 Technik-Stack
- **Frontend**: Vite, React, Tailwind CSS, Motion.
- **Backend**: Node.js Express Server.
- **Automatisierung**: Playwright (Headless Browser) & Node-Cron.
- **Security**: Pfad-Validierung & strukturierte Log-Rotation.

## 📂 Verzeichnisstruktur
- `/public/images`: Archivierte DWD-Bilder (Images).
- `/data`: Archivierte Rohdaten (CSV/ZIP).
- `/logs`: System-Protokolle (Info/Fehler).
- `config/app-config.ts`: Zentrale Task-Konfiguration.
