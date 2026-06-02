# 📄 Dokumentation: AgriData DWD v2.0 - Entwicklungsübersicht

Diese Dokumentation fasst die im Chat besprochenen und umgesetzten Funktionen sowie die Struktur der Applikation zusammen.

---

## 1. Übersicht & Zielsetzung
Die App **AgriData DWD** wurde entwickelt, um agrarrelevante Wetterdaten des Deutschen Wetterdienstes (DWD) automatisiert zu erfassen, zu archivieren und übersichtlich darzustellen. Der Fokus liegt auf Bodenfeuchte- und Bodentemperaturdaten, insbesondere für die Region Schleswig-Holstein sowie für spezifische Bodentypen (Schluf vs. Sand).

---

## 2. Funktionsbereiche der App

### 🛠 Steuerung (Control Center)
In der linken Seitenleiste befindet sich das Kontrollzentrum. Hier können die automatisierten Prozesse jederzeit auch **manuell** angestoßen werden:
- **Bilder / Images laden**: Startet den Direkt-Download der visuellen DWD-Karten (.png). Durch eine intelligente Schnittstelle werden die Bilder direkt vom DWD-Server geladen und archiviert.
- **DWD Klimadaten**: Startet den Download der rohen ZIP-Archive vom CDC (Climate Data Center). Das System sucht automatisch nach den aktuellsten Dateien und speichert sie lokal.

### 📊 System Info
Bietet einen schnellen Überblick über den Betriebszustand:
- **Uptime**: Zeigt an, wie lange der Server bereits ohne Unterbrechung läuft.
- **Letzter Check**: Zeitstempel der letzten automatisierten oder manuellen Aktivität.
- **Online-Status**: Visuelle Anzeige (grüner Puls), ob die Verbindung zum Backend besteht.

### 📂 Archiv (Dateimanagement)
Hier werden alle erfolgreich erfassten Dateien aufgelistet.
- **Anzeige**: Unterscheidung zwischen "Image" (Bilddaten) und "Daten" (ZIP/CSV).
- **Download-Button**: Jede Datei kann direkt über den Browser heruntergeladen werden.
- **Lösch-Funktion**: Um Speicherplatz zu sparen, können veraltete Dateien gelöscht werden. Ein **Sicherheits-Dialog** ("JA, WEG DAMIT") verhindert versehentliches Löschen.

### 📝 Protokolle (Live-Logs)
Der rechte Bereich ist das Herzstück für die Überwachung der Prozesse:
- **Kategorien**: Umschaltung zwischen **Images**, **Datensätze** und **Fehler**.
- **Live-Streaming**: Neue Protokolleinträge erscheinen sofort.
- **Bildvorschau**: Bei erfolgreichen Image-Downloads wird direkt ein Vorschaubild im Log angezeigt.
- **Logs löschen**: Über eine dedizierte Funktion können die Protokolldateien pro Kategorie bereinigt werden.

---

## 3. Automatisierung (Smart Cron)
Das System läuft vollautomatisch im Hintergrund. Folgende Intervalle wurden konfiguriert:
- **Tägliche Bilder (Bodenfeuchte)**: Jeden Tag um **16:00 Uhr**.
- **Bodentemperatur (DE)**: Alle **5 Tage** (16:00 Uhr).
- **Regionale SH-Werte**: Alle **10 Tage** (16:00 Uhr).
- **Klimadaten-ZIPs**: Jeweils am **1. des Monats** (16:00 Uhr).

---

## 4. Wichtige Anpassungen im Chat
Während der Entwicklung wurden folgende spezifische Optimierungen vorgenommen:
1.  **Begrifflichkeit**: Umstellung von "Screenshots" auf **"Bilder / Images"**, da es sich um Direkt-Downloads der Quelldateien handelt und nicht um reine Browser-Abbilder.
2.  **Dateistruktur**: Verschiebung der Speicherorte von `/public/screenshots` nach `/public/images` für eine saubere Benennung.
3.  **Fehlerbehebung**: Implementierung strukturierter Fehler-Logs (`error.log`), die über das Dashboard eingesehen werden können.
4.  **Sicherheit**: Dateipfade werden serverseitig validiert, um unbefugte Zugriffe oder Löschungen außerhalb der Zielverzeichnisse zu verhindern.

---

## 5. Technische Basis
- **Frontend**: React 18 mit Vite & Tailwind CSS (Aesthetic: Dark-Glassmorphism).
- **Backend**: Express.js (Node.js) mit `node-cron` und `axios` für Datentransfers.
- **Design**: Icons von `lucide-react`, Animationen via `motion/react`.

---

## 6. Spezielle Verhaltensweisen & Troubleshooting

### 🔄 Verhalten von automatischen Cron-Downloads im Serverless-Hosting
Ein häufig beobachtetes Verhalten während der Offline-Phase: **"Manuelle Downloads funktionieren hervorragend, automatische Downloads laden dagegen keine Daten oder Bilder."**

**Ursache:**
Die Anwendung läuft in einer containerisierten Cloud-Umgebung (z.B. Google Cloud Run). Diese Dienste nutzen ein ressourcensparendes Auto-Scaling:
1. Wenn **keine aktiven Zugriffe** vorliegen (keine Website-Aufrufe, keine API-Requests), versetzt die Plattform den Server-Container nach wenigen Inaktivitätsminuten in den **Schlafmodus (Scale-to-Zero)**.
2. Während des Schlafmodus schläft auch das Node.js backend. Dies bedeutet, dass geplante `node-cron` Hintergrund-Timer ebenfalls eingefroren werden und um 16:00 Uhr **nicht** selbstständig aufwachen können.
3. Sobald der Browser-Tab geöffnet wird oder eine manuelle Steuerung angewählt wird, wacht das System blitzschnell auf (Cold Start) und führt die Befehle sofort aus.

**Wie das Browser-Fenster als Keep-Alive dient:**
Wenn Sie das Dashboard im Browser auf Ihrem Computer offen lassen, sendet das Dashboard alle **10 Sekunden** automatische Abfragen (`/api/status`, `/api/logs` etc.) an das Backend. Diese regelmäßigen Anfragen verhindern, dass der Container schlafen geht. Der Server bleibt am Leben und führt die Cron-Jobs zur exakten Uhrzeit aus.

**Alternative Lösungen für dauerhaften Offline-Betrieb (nach Export):**
Für eine vollständige Unabhängigkeit ohne geöffnetes Browserfenster gibt es zwei gängige Produktions-Wege:
- **Dauerhafte VM**: Deployment auf einem kontinuierlich laufenden VPS / Server (wie Hetzner, AWS EC2, DigitalOcean), auf dem der Node.js-Prozess niemals schlafen geht.
- **Externer Trigger (Cloud Scheduler)**: Einrichten eines externen Triggers (z. B. Google Cloud Scheduler oder ein Cron-Job-Dienst wie cron-job.org), der täglich um 16:30 Uhr einen POST-Request an `/api/tasks/images` und `/api/tasks/downloads` sendet. Das weckt den Server sofort auf, triggert die Downloads und legt ihn danach wieder schlafen.

---

## 7. Anleitung: Gesamten Chatverlauf sichern
Um den bisherigen Entwicklungsverlauf, alle erklärten Logiken und den Chat als Nachschlagewerk herunterzuladen, stehen Ihnen folgende Optionen in Google AI Studio zur Verfügung:

1. **Projekt-Export**:
   - Klicken Sie im AI Studio Menü (meist rechts oben bei den Projekteinstellungen) auf **Export** oder **Export to ZIP / Export to GitHub**. Dadurch erhalten Sie das komplette Projekt samt Quellcode und Dokumentation in einer archivierten Form.
2. **Als PDF drucken (Empfohlen für Textverlauf)**:
   - Nutzen Sie die Druckfunktion Ihres Desktop-Browsers: Drücken Sie `Strg + P` (Windows) bzw. `Cmd + P` (Mac).
   - Wählen Sie als Drucker **"Als PDF speichern"** aus.
   - Tipp: Stellen Sie in den Druckereinstellungen "Hintergrundgrafiken einschließen" ein, um die Chat-Formatierung und Farbcodierungen für optimale Lesbarkeit beizubehalten.
3. **Textkopie**:
   - Markieren Sie den gewünschten Abschnitt im Chat und kopieren Sie ihn in eine lokale Text- oder Markdown-Datei auf Ihrem Rechner.

---

## 8. IONOS-Deployment & Subdomain-Einrichtung (Schritt-für-Schritt)

Da es sich bei der Anwendung um eine **Full-Stack Node.js App** (React + Express) mit permanent laufenden Background-Zeitsteuerungen (`node-cron`) handelt, ist ein **IONOS VPS (Virtual Private Server)** oder **Cloud Server** die ideale Wahl. Normales Shared Webhosting ("Webspace") reicht meist nicht aus, da dort keine dauerhaften Node.js-Dienste im Hintergrund laufen können.

### 🌐 Schritt 1: Subdomain bei IONOS anlegen und auf den Server leiten
1. Loggen Sie sich in Ihr **IONOS Kundencenter** ein.
2. Navigieren Sie zu den **Domains & SSL** Einstellungen und wählen Sie Ihre Hauptdomain aus.
3. Klicken Sie auf den Reiter **Subdomains** und erstellen Sie eine neue Subdomain (z.B. `agridata.ihredomain.de`).
4. Klicken Sie neben der neu erstellten Subdomain auf das Zahnrad-Symbol ⚙️ und wählen Sie **DNS**.
5. Bearbeiten Sie den **A-Record**:
   - Tragen Sie unter **Wert** (bzw. IP-Adresse) die öffentliche **IPv4-Adresse Ihres IONOS VPS** ein.
   - Speichern Sie die Änderungen. (Es kann bis zu eine Stunde dauern, bis die DNS-Änderung weltweit aktiv ist).

### 🐧 Schritt 2: VPS vorbereiten (Ubuntu/Linux)
Verbinden Sie sich per SSH mit Ihrem IONOS VPS (z.B. über das Terminal oder PuTTY mit dem Befehl `ssh root@<Ihre-VPS-IP>`) und führen Sie folgende Befehle aus, um das System zu aktualisieren und Node.js zu installieren:

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js (Version 20 LTS) & npm installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 📦 Schritt 3: App-Code übertragen & installieren
1. Exportieren Sie das Projekt aus Google AI Studio als ZIP und laden Sie es auf Ihren Computer herunter.
2. Übertragen Sie die ZIP-Datei auf Ihren Server (z.B. mittels **FileZilla** per SFTP oder direkt über Git/SCP) und entpacken Sie sie im Verzeichnis `/var/www/agridata`.
3. Navigieren Sie auf dem Server in das Verzeichnis und installieren Sie die Abhängigkeiten:
   ```bash
   cd /var/www/agridata
   npm install
   ```

### 🏗️ Schritt 4: App für Produktion bauen
Um die Frontend-Dateien performant zu kompilieren und das Express-Backend startklar zu machen, führen Sie auf dem VPS den Build-Command aus:
```bash
npm run build
```
Dies erzeugt einen optimierten `/dist`-Ordner und bündelt das Backend in `dist/server.cjs`.

### 🚀 Schritt 5: PM2 als Prozess-Manager installieren (Dauerhafter Hintergrund-Lauf)
Damit die App dauerhaft im Hintergrund läuft – auch wenn Sie das SSH-Fenster schließen oder der Server neu startet – nutzen wir **PM2**:
```bash
# PM2 global installieren
sudo npm install pm2 -g

# App starten (wir starten die gebündelte CJS-Datei)
pm2 start dist/server.cjs --name "agridata"

# Autostart bei Server-Reboot aktivieren
pm2 startup
pm2 save
```

### 🛡️ Schritt 6: Nginx als Reverse-Proxy und SSL (HTTPS) einrichten
Um Ihre Subdomain `agridata.ihredomain.de` sicher (HTTPS) auf die App (Port 3000) weiterzuleiten:

1. **Nginx installieren:**
   ```bash
   sudo apt install nginx -y
   ```
2. **Nginx Konfiguration erstellen:**
   Öffnen Sie eine neue Konfigurationsdatei:
   ```bash
   sudo nano /etc/nginx/sites-available/agridata
   ```
   Fügen Sie folgenden Inhalt ein (ersetzen Sie `agridata.ihredomain.de` durch Ihre echte Subdomain):
   ```nginx
   server {
       listen 80;
       server_name agridata.ihredomain.de;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. **Konfiguration aktivieren & Nginx neu starten:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/agridata /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```
4. **Kostenloses SSL-Zertifikat (HTTPS) via Let's Encrypt einrichten:**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d agridata.ihredomain.de
   ```
   Folgen Sie den Anweisungen auf dem Bildschirm. Certbot konfiguriert Nginx automatisch so, dass sämtlicher Datenverkehr über sicheres HTTPS läuft.

---
*Dokumentation aktualisiert am 2. Juni 2026*
