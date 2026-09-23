import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './server/routes/auth.ts';
import { subjectsRouter } from './server/routes/subjects.ts';
import { quizzesRouter } from './server/routes/quizzes.ts';
import { attemptsRouter } from './server/routes/attempts.ts';
import { questionBankRouter } from './server/routes/questionBank.ts';
import { leaderboardRouter } from './server/routes/leaderboard.ts';
import { adminRouter } from './server/routes/admin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // Dev server must always bind to port 3000 because Nginx reverse proxy listens on 8080 and forwards to 3000
  const PORT = 3000;

  // JSON Body parsing
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/subjects', subjectsRouter);
  app.use('/api/quizzes', quizzesRouter);
  app.use('/api/attempts', attemptsRouter);
  app.use('/api/question-bank', questionBankRouter);
  app.use('/api/leaderboard', leaderboardRouter);
  app.use('/api/admin', adminRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'healthy', platform: 'AWASI QIUZWEB PLATFORM', timestamp: new Date().toISOString() });
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AWASI QIUZWEB Server] Running on http://0.0.0.0:${PORT} (Mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('[AWASI QIUZWEB Server] Fatal error starting server:', err);
  process.exit(1);
});
