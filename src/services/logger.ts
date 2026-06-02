import fs from 'fs-extra';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

async function ensureLogDir() {
  await fs.ensureDir(LOG_DIR);
}

type LogType = 'download' | 'image' | 'error' | 'system';

// Explicit routing of a log source to its target file.
// Anything that is not a download/image event (e.g. 'system', 'manual')
// is collected in system.log instead of polluting image.log.
function resolveLogFile(source: string): string {
  if (source.includes('download')) return 'download.log';
  if (source.includes('image')) return 'image.log';
  return 'system.log';
}

function formatMessage(source: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  return JSON.stringify({
    timestamp,
    source,
    message,
    data
  }) + '\n';
}

export const logger = {
  async info(source: string, message: string, data?: any) {
    await ensureLogDir();
    const logFile = resolveLogFile(source);
    const entry = formatMessage(source, message, data);
    console.log(`[INFO][${source}] ${message}`);
    await fs.appendFile(path.join(LOG_DIR, logFile), entry);
  },

  async error(source: string, message: string, error?: any) {
    await ensureLogDir();
    const entry = formatMessage(source, message, {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error
    });
    console.error(`[ERROR][${source}] ${message}`, error);
    await fs.appendFile(path.join(LOG_DIR, 'error.log'), entry);
  },

  async getLogs(type: LogType, limit = 100) {
    await ensureLogDir();
    const logFile = path.join(LOG_DIR, `${type}.log`);
    if (!(await fs.pathExists(logFile))) return [];
    
    const content = await fs.readFile(logFile, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim().length > 0);
    
    return lines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { message: line };
        }
      })
      .reverse()
      .slice(0, limit);
  },

  async clearLogs(type: LogType) {
    const logFile = path.join(LOG_DIR, `${type}.log`);
    console.log(`Clearing logs for type: ${type} at path: ${logFile}`);
    if (await fs.pathExists(logFile)) {
      await fs.writeFile(logFile, '');
      console.log(`Logs cleared for ${type}`);
    } else {
      // If doesn't exist, create empty
      await fs.ensureDir(LOG_DIR);
      await fs.writeFile(logFile, '');
      console.log(`Created empty log file for ${type}`);
    }
  }
};
