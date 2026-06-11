import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import healthRouter from './routes/health';
import habitsRouter from './routes/habits';
import { piiRedactorMiddleware } from './middleware/security';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : '*', // no CORS in prod (same origin)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json());

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(piiRedactorMiddleware);

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/', healthRouter);
app.use('/api', habitsRouter);

// ─── Static Frontend (Single-Container Production) ─────────────────────────
const staticDir = path.join(__dirname, '../../public');
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  // SPA fallback — return index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    const indexPath = path.join(staticDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
  console.log(`[Static] Serving frontend from ${staticDir}`);
}

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('========================================');
    console.log(` HabitLoop API Running on Port ${PORT}`);
    console.log(` Health: http://localhost:${PORT}/health`);
    console.log('========================================');
  });
}

export default app;
