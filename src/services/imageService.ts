import { chromium } from 'playwright-chromium';
import path from 'path';
import fs from 'fs-extra';
import axios from 'axios';
import { logger } from './logger';
import { CONFIG } from '../../config/app-config';

const IMAGE_DIR = path.join(process.cwd(), 'public', 'images');

export const imageService = {
  async capture(name: string, url: string) {
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const targetDir = path.join(IMAGE_DIR, name, dateStr);
    await fs.ensureDir(targetDir);
    
    const fileName = `${timeStr}_${name}.png`;
    const filePath = path.join(targetDir, fileName);
    const publicPath = `/images/${name}/${dateStr}/${fileName}`;

    // Optimization: If it's a direct image URL, handle it strictly as a download
    const isDirectImage = url.toLowerCase().match(/\.(png|jpg|jpeg|webp)$/);
    
    if (isDirectImage) {
      const maxAttempts = Math.max(1, CONFIG.settings.retryCount);
      const retryDelay = CONFIG.settings.retryDelayMs;
      let lastError: unknown;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          await logger.info('image', `Starting direct image download: ${name} from ${url} (attempt ${attempt}/${maxAttempts})`);
          const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: CONFIG.settings.imageTimeout,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
              'Referer': 'https://www.dwd.de/'
            }
          });

          // Verify it is actually an image
          const contentType = response.headers['content-type'];
          if (typeof contentType === 'string' && !contentType.startsWith('image/')) {
            throw new Error(`Expected image but received ${contentType}. Request might be blocked or redirecting to an error page.`);
          }

          await fs.writeFile(filePath, response.data);
          await logger.info('image', `Image successfully downloaded: ${name}`, { publicPath, attempt });
          return publicPath;
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          await logger.error('image', `Direct image download failed for ${name} (attempt ${attempt}/${maxAttempts}): ${msg}`);
          // Wait before the next attempt, unless this was the last one.
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }

      const msg = lastError instanceof Error ? lastError.message : String(lastError);
      // If the user specified images (*.png), we should probably not fall back to browser screenshots of error pages
      throw new Error(`Direct download of ${url} failed after ${maxAttempts} attempt(s): ${msg}`);
    }

    // Normal Playwright flow only for non-image URLs
    await logger.info('image', `Url is not a direct image, using browser fallback for ${name}`);
    const browser = await chromium.launch({ 
      headless: CONFIG.settings.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage({
        viewport: CONFIG.settings.resolution
      });
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);
      
      // Try to take a screenshot as fallback
      await page.screenshot({ path: filePath, fullPage: true });
      await logger.info('image', `captured screenshot for ${name} via browser`, { publicPath });
      
      return publicPath;
    } catch (error) {
      await logger.error('image', `Failed to capture ${name}`, error);
      throw error;
    } finally {
      await browser.close();
    }
  },

  async runAll() {
    const tasks = CONFIG.tasks;
    const results = [];
    
    // Captured sequentially to avoid resource exhaustion
    for (const task of tasks) {
      try {
        const path = await this.capture(task.name, task.url);
        results.push({ name: task.name, path });
      } catch (e) {
        results.push({ name: task.name, error: true });
      }
    }
    return results;
  }
};
