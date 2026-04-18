import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { connectDB } from './utils/db.js';
import { authRouter } from './auth/auth.routes.js';
import { apiRouter } from './routes/index.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { globalRateLimiter } from './middleware/rateLimiter.middleware.js';
import { initSocketServer } from './notifications/socket.server.js';

const app = express();
const server = http.createServer(app);

// ─── Socket.io ───
initSocketServer(server);

// ─── Security ───
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ───
app.use(globalRateLimiter);

// ─── Health Check ───
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'monolith-gateway', ts: Date.now() }));

// ─── Public Routes (no auth) ───
app.use('/api/auth', authRouter);

// ─── Protected Routes (all require valid JWT) ───
app.use('/api', authMiddleware, apiRouter);

// ─── Error Handler ───
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start ───
const PORT = Number(process.env.PORT || 4000);

async function start() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aether_phase1_test');
  server.listen(PORT, () => {
    console.log(`[Aether Backend] Running monolith server on port ${PORT}`);
  });
}

start().catch(console.error);

export { app, server };
