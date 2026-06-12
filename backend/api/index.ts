import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import habitsRouter from './routes/habits';
import { piiRedactorMiddleware } from './middleware/security';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ─── CORS ──────────────────────────────────────────────────────────────────
// In production (Firebase Hosting + Cloud Run): allow the Firebase Hosting URL.
// Set FRONTEND_URL env var on Cloud Run to e.g. https://your-project.web.app
// In development: allow all origins.
const allowedOrigin =
  process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || false
    : '*';

app.use(cors({
  origin: allowedOrigin,
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
    console.log(` CORS Origin: ${allowedOrigin || 'same-origin'}`);
    console.log('========================================');
  });
}

export default app;
