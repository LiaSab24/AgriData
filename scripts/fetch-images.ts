/**
 * Einmaliger Abruf aller in config/app-config.ts konfigurierten DWD-Karten.
 *
 * Ersetzt in der serverlosen Variante den node-cron-Scheduler: Statt dass ein
 * dauerhaft laufender Prozess die Uhr im Blick behaelt, ruft GitHub Actions
 * dieses Skript auf und committet das Ergebnis ins Repository.
 *
 * Die eigentliche Download-Logik (Retries, Content-Type-Pruefung, DWD-Referer)
 * bleibt bewusst in src/services/imageService.ts - hier wird sie nur angestossen
 * und ausgewertet.
 */
import { imageService } from '../src/services/imageService';

type Result = { name: string; path?: string; error?: boolean };

async function main() {
  const results: Result[] = await imageService.runAll();

  const ok = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);

  console.log('\n--- Ergebnis ---');
  for (const r of results) {
    console.log(r.error ? `FEHLER   ${r.name}` : `OK       ${r.name}  ->  ${r.path}`);
  }
  console.log(`\n${ok.length} von ${results.length} Karten abgerufen.`);

  // Teilerfolge bleiben erhalten: Der Workflow committet, was da ist, und
  // markiert den Lauf danach trotzdem als fehlgeschlagen, damit ein stiller
  // Dauerausfall einzelner Karten nicht unbemerkt bleibt.
  if (failed.length > 0) {
    console.error(`\n${failed.length} Karte(n) fehlgeschlagen: ${failed.map(f => f.name).join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error('Abruf abgebrochen:', err);
  process.exit(1);
});
