# Wetterdaten-Skill: DWD Agrar-Monitoring v2.0

## Projektziel
Automatisierte Erfassung, Archivierung und Visualisierung von Boden- und Wetterdaten des Deutschen Wetterdienstes (DWD) für die Präzisionslandwirtschaft.

## Aktuelle Tasks & Intervalle
Die Datenerfassung ist in spezifische Tasks unterteilt, die individuell via Cron gesteuert werden:

1. **Bodenfeuchte (Schwerer Boden - lehmiger Schluf)**
   - **URL**: `https://www.dwd.de/DWD/klima/agrar/bf/bf_r_DL_stationen_sl.png`
   - **Intervall**: Täglich um 16:00 Uhr (`0 16 * * *`)
   - **Speicherort**: `/public/images/bodenfeuchte_schluf/`

2. **Bodenfeuchte (Leichter Boden - lehmiger Sand)**
   - **URL**: `https://www.dwd.de/DWD/klima/agrar/bf/bf_r_DL_stationen_ls.png`
   - **Intervall**: Täglich um 16:00 Uhr (`0 16 * * *`)
   - **Speicherort**: `/public/images/bodenfeuchte_sand/`

3. **Bodenfeuchte (SH, Ostenfeld/Rendsburg)**
   - **URL**: `https://www.dwd.de/DWD/klima/agrar/bf/bf_r_SH_A443.png`
   - **Intervall**: Alle 10 Tage um 16:00 Uhr (`0 16 */10 * *`)
   - **Speicherort**: `/public/images/bodenfeuchte_sh_ostenfeld/`

4. **Bodentemperatur (Deutschland, 5cm Tiefe)**
   - **URL**: `https://www.dwd.de/DWD/klima/agrar/bt/bt_r_DL_stationen.png`
   - **Intervall**: Alle 5 Tage um 16:00 Uhr (`0 16 */5 * *`)
   - **Speicherort**: `/public/images/bodentemperatur_de_5cm/`

5. **Bodentemperatur (SH, Ostenfeld/Rendsburg)**
   - **URL**: `https://www.dwd.de/DWD/klima/agrar/bt/bt_r_SH_A443.png`
   - **Intervall**: Alle 10 Tage um 16:00 Uhr (`0 16 */10 * *`)
   - **Speicherort**: `/public/images/bodentemperatur_sh_ostenfeld/`

## Features
- **Manuelle Steuerung**: Image- und Daten-Tasks können jederzeit über das Dashboard manuell getriggert werden.
- **Archiv-Management**: Erfasste Dateien können im Dashboard eingesehen, heruntergeladen und gelöscht werden.
- **Live-Logs**: Echtzeit-Protokollierung aller Systemaktivitäten (Erfolge, Fehler, Warnungen).
- **Responsive Design**: Modernes Dashboard mit Glasmorphismus-Effekten und optimierter Anzeige für Desktop und Mobile.

## Technische Details
- **Frontend**: Vite + React + Tailwind CSS + Lucide Icons.
- **Backend**: Express (Node.js) mit Playwright für Screenshot-Automatisierung.
- **Scheduler**: `node-cron` für präzises Task-Management.
- **Speicherung**: Lokale Dateistruktur in `/data` (Rohdaten) und `/public/images` (Bilder).

## Konfiguration
Umweltvariablen (`.env`):
- `BF_SCHLUF_CRON`: Cron für Feuchte (Schluf)
- `BF_SAND_CRON`: Cron für Feuchte (Sand)
- `BF_SH_CRON`: Cron für Feuchte (SH)
- `BT_DE_CRON`: Cron für Temperatur (DE)
- `BT_SH_CRON`: Cron für Temperatur (SH)
- `TIMEOUT_MS`: Playwright Timeout (Standard: 60000ms)
