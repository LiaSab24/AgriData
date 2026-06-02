import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { scheduler } from './src/services/scheduler';
import { logger } from './src/services/logger';
import { imageService } from './src/services/imageService';
import { dataService } from './src/services/dataService';
import fs from 'fs-extra';

async function startServer() {
  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Logging middleware for debugging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get('/api/status', (req, res) => {
    console.log('Hitting /api/status');
    res.json({
      status: 'running',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      cwd: process.cwd(),
      dirs: {
        logs: path.join(process.cwd(), 'logs'),
        data: path.join(process.cwd(), 'data')
      }
    });
  });

  app.get('/api/files', async (req, res) => {
    try {
      const files: any[] = [];
      const dataRoot = path.join(process.cwd(), 'data');
      const imagesRoot = path.join(process.cwd(), 'public', 'images');

      const scanDir = async (dir: string, base: string, urlPrefix: string) => {
        if (!(await fs.pathExists(dir))) return;
        const items = await fs.readdir(dir, { withFileTypes: true });
        for (const item of items) {
          const relativePath = path.join(base, item.name);
          const fullPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            await scanDir(fullPath, relativePath, urlPrefix);
          } else {
            const stats = await fs.stat(fullPath);
            files.push({
              name: item.name,
              path: `${urlPrefix}/${relativePath.replace(/\\/g, '/')}`,
              size: stats.size,
              mtime: stats.mtime,
              type: urlPrefix.includes('images') ? 'Image' : 'Daten'
            });
          }
        }
      };

      await scanDir(dataRoot, '', '/data');
      await scanDir(imagesRoot, '', '/images');

      console.log(`Found ${files.length} files total across data and images`);
      
      // Sort by modified time descending
      files.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      res.json(files);
    } catch (error) {
      console.error('Failed to list files:', error);
      res.status(500).json({ error: 'Failed to list files' });
    }
  });

  app.get('/api/logs/:type', async (req, res) => {
    try {
      const type = req.params.type as 'download' | 'image' | 'error' | 'system';
      const logs = await logger.getLogs(type);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  app.delete('/api/logs/:type', async (req, res) => {
    try {
      const type = req.params.type as 'download' | 'image' | 'error' | 'system';
      await logger.clearLogs(type);
      res.json({ message: 'Logs cleared' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear logs' });
    }
  });

  app.post('/api/tasks/images', async (req, res) => {
    try {
      logger.info('manual', 'Manual image task triggered');
      const results = await imageService.runAll();
      res.json({ message: 'Task started', results });
    } catch (error) {
      res.status(500).json({ error: 'Task failed' });
    }
  });

  app.post('/api/tasks/downloads', async (req, res) => {
    try {
      logger.info('manual', 'Manual download task triggered');
      const results = await dataService.runDailyDownloads();
      res.json({ message: 'Task started', results });
    } catch (error) {
      res.status(500).json({ error: 'Task failed' });
    }
  });

  app.delete('/api/files', async (req, res) => {
    try {
      const { filePath } = req.body;
      if (!filePath || typeof filePath !== 'string') {
        return res.status(400).json({ error: 'Missing filePath' });
      }

      // 1. Clean the path and distinguish between data and images
      let targetPath = '';
      const dataRoot = path.resolve(process.cwd(), 'data');
      const imagesRoot = path.resolve(process.cwd(), 'public', 'images');

      if (filePath.startsWith('/data')) {
        const relativePart = filePath.substring(5).replace(/^\/+/, '');
        targetPath = path.resolve(dataRoot, relativePart);
      } else if (filePath.startsWith('/images')) {
        const relativePart = filePath.substring(7).replace(/^\/+/, '');
        targetPath = path.resolve(imagesRoot, relativePart);
      } else {
        // Fallback for non-prefixed paths if any
        targetPath = path.resolve(process.cwd(), filePath.replace(/^\/+/, ''));
      }

      // 2. Security Check (ensure it's inside allowed dirs)
      // Use path.relative instead of startsWith: a naive startsWith check
      // would let "/.../data-evil" pass as it is prefixed by "/.../data",
      // and would not catch "../" traversal segments reliably.
      const resolvedPath = path.resolve(targetPath);
      const isInside = (root: string, target: string) => {
        const rel = path.relative(root, target);
        return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
      };
      const isInsideData = isInside(dataRoot, resolvedPath);
      const isInsideImages = isInside(imagesRoot, resolvedPath);

      if (!isInsideData && !isInsideImages) {
        console.error(`Security block: ${resolvedPath} is outside allowed roots. DataRoot: ${dataRoot}, ImageRoot: ${imagesRoot}`);
        return res.status(403).json({ error: 'Access denied', detail: `Path ${resolvedPath} is outside managed directories` });
      }

      // 3. Perform Deletion
      if (await fs.pathExists(resolvedPath)) {
        console.log(`DELETING FILE: ${resolvedPath}`);
        await fs.remove(resolvedPath);
        await logger.info('system', `File deleted: ${filePath}`);
        res.json({ message: 'File deleted' });
      } else {
        console.warn(`File not found for deletion: ${resolvedPath}`);
        res.status(404).json({ error: 'File not found', detail: `The file ${filePath} could not be found on the server at ${resolvedPath}` });
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Failed to delete file:', error);
      await logger.error('system', `Failed to delete file: ${req.body.filePath}`, error);
      res.status(500).json({ error: 'Failed to delete file', detail: errMsg });
    }
  });

  // Serve static folders
  const imagesPath = path.join(process.cwd(), 'public', 'images');
  const dataPath = path.join(process.cwd(), 'data');
  await fs.ensureDir(imagesPath);
  await fs.ensureDir(dataPath);
  
  app.use('/images', express.static(imagesPath));
  app.use('/data', express.static(dataPath));

  // Start listening immediately
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Weather Data System running at http://0.0.0.0:${PORT}`);
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    console.log('Initializing Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware ready');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start Scheduler
  await scheduler.start();
  
  // Initial startup log
  try {
    await logger.info('system', 'Wetterdaten-System erfolgreich gestartet und bereit.');
    console.log('Startup log written to file.');
  } catch (err) {
    console.error('Failed to write startup log:', err);
  }
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
