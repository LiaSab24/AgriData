import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger';

const DATA_DIR = path.join(process.cwd(), 'data');

export const dataService = {
  async downloadFile(url: string, category: string) {
    const dateStr = new Date().toISOString().split('T')[0];
    const targetDir = path.join(DATA_DIR, category, dateStr);
    await fs.ensureDir(targetDir);

    const fileName = path.basename(new URL(url).pathname) || `data_${Date.now()}.bin`;
    const filePath = path.join(targetDir, fileName);

    try {
      // Check if file already exists
      if (await fs.pathExists(filePath)) {
        await logger.info('download', `File ${fileName} already exists, skipping.`);
        return { fileName, skipped: true };
      }

      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        timeout: 60000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const writer = fs.createWriteStream(filePath);

      // Helper to remove a partially written file so it is not
      // mistaken for a complete download on the next run.
      const cleanupPartial = async () => {
        try {
          if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
            await logger.info('download', `Removed partial file ${fileName} after failure`);
          }
        } catch (cleanupErr) {
          await logger.error('download', `Failed to remove partial file ${fileName}`, cleanupErr);
        }
      };

      return new Promise((resolve, reject) => {
        writer.on('finish', async () => {
          await logger.info('download', `Successfully downloaded ${fileName} to ${category}`);
          resolve({ fileName, skipped: false });
        });
        writer.on('error', async (err) => {
          await logger.error('download', `Stream error for ${fileName}`, err);
          writer.destroy();
          await cleanupPartial();
          reject(err);
        });
        // Abort/error on the source stream (e.g. connection dropped)
        // would otherwise leave a truncated file behind.
        response.data.on('error', async (err: Error) => {
          await logger.error('download', `Source stream error for ${fileName}`, err);
          writer.destroy();
          await cleanupPartial();
          reject(err);
        });

        response.data.pipe(writer);
      });
    } catch (error) {
      await logger.error('download', `Failed to download from ${url}`, error);
      throw error;
    }
  },

  async findLatestFile(baseUrl: string, pattern: RegExp) {
    try {
      const response = await axios.get(baseUrl, { timeout: 10000 });
      const html = response.data as string;
      // We wrap the pattern in a global group match for href
      const combinedPattern = new RegExp(`href="(${pattern.source})"`, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      const matches = html.matchAll(combinedPattern);
      const files = Array.from(matches).map(m => m[1]);
      
      if (files.length === 0) return null;
      
      // Sort files to find the latest (assuming names contain timestamps or strictly alphabetical)
      files.sort().reverse();
      return files[0];
    } catch (error) {
      await logger.error('download', `Failed to fetch index from ${baseUrl}`, error);
      return null;
    }
  },

  async runDailyDownloads() {
    const categories = [
      { 
        baseUrl: 'https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/soil_temperature/recent/', 
        pattern: /tageswerte_EB_.*_akt\.zip/i,
        category: 'soil_temp'
      },
      { 
        baseUrl: 'https://opendata.dwd.de/climate_environment/CDC/derived_germany/soil/daily/recent/', 
        // DWD hat die Struktur geaendert: statt einer gebuendelten 'tageswerte_BF_*_akt.zip'
        // liegen hier nun pro Station gzippte Textdateien:
        //   derived_germany_soil_daily_recent_v2_<STATION>.txt.gz
        pattern: /derived_germany_soil_daily_recent_v2_\d+\.txt\.gz/i,
        category: 'soil_moisture'
      }
    ];

    const results = [];
    for (const item of categories) {
      try {
        const latestFile = await this.findLatestFile(item.baseUrl, item.pattern);
        if (latestFile) {
          const url = `${item.baseUrl}${latestFile}`;
          const res = await this.downloadFile(url, item.category);
          results.push(res);
        } else {
          await logger.error('download', `No files matching ${item.pattern} found at ${item.baseUrl}`);
          results.push({ category: item.category, error: 'No matching file found' });
        }
      } catch (e) {
        results.push({ category: item.category, error: true });
      }
    }
    return results;
  }
};
