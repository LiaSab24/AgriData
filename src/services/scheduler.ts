import cron from 'node-cron';
import { logger } from './logger';
import { imageService } from './imageService';
import { dataService } from './dataService';
import { CONFIG } from '../../config/app-config';

export const scheduler = {
  async start() {
    console.log('Starting Weather Data Schedulers...');
    await logger.info('system', `Automatischer Scheduler gestartet. Bilder-Tasks: ${CONFIG.tasks.length}, Daten-Sync: ${CONFIG.settings.monthlyDataCron}`);
    
    // Register individual tasks
    CONFIG.tasks.forEach(task => {
      cron.schedule(task.cron, async () => {
        await logger.info('system', `Starting scheduled task: ${task.name}`);
        try {
          await imageService.capture(task.name, task.url);
          await logger.info('system', `Finished scheduled task: ${task.name}`);
        } catch (error) {
          await logger.error('system', `Scheduled task failed: ${task.name}`, error);
        }
      });
      console.log(`- Task Registered: ${task.name} (${task.cron})`);
    });

    // Register monthly raw data downloads
    cron.schedule(CONFIG.settings.monthlyDataCron, async () => {
      await logger.info('system', `Triggered scheduled data sync (Cron: ${CONFIG.settings.monthlyDataCron})`);
      try {
        const results = await dataService.runDailyDownloads();
        await logger.info('system', `Completed scheduled data sync: ${JSON.stringify(results)}`);
      } catch (error) {
        await logger.error('system', 'Scheduled data sync failed', error);
      }
    });
    console.log(`- Task Registered: Monthly Raw Downloads (${CONFIG.settings.monthlyDataCron})`);

    console.log('Schedulers active.');
  }
};
