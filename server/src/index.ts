import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter from './routes/auth.js';
import transactionsRouter from './routes/transactions.js';
import fraudRouter from './routes/fraud.js';
import alertsRouter from './routes/alerts.js';
import analyticsRouter from './routes/analytics.js';
import dashboardRouter from './routes/dashboard.js';
import personalFinanceRouter from './routes/personal-finance.js';
import simulationRouter from './routes/simulation.js';
import adminRouter from './routes/admin.js';
import reportsRouter from './routes/reports.js';
import { db } from './db/db.js';
import { seedDatabase } from './db/seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for seamless development and viva demo
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    platform: 'FinShield AI',
    version: '1.0.0',
    mode: 'Intelligent Fraud & Risk Detection Platform',
    transactionsCount: db.getState().transactions.length,
    usersCount: db.getState().users.length
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/fraud', fraudRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/personal-finance', personalFinanceRouter);
app.use('/api/simulation', simulationRouter);
app.use('/api/admin', adminRouter);
app.use('/api/reports', reportsRouter);

// 404 Handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Startup & Auto-seed
async function startServer() {
  try {
    if (!db.isSeeded()) {
      console.log('Database not yet seeded. Running automatic initialization with 1,000 transactions...');
      await seedDatabase(false);
    }

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  FinShield AI Server is running on port ${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  Database: ${db.getState().transactions.length} transactions loaded`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to initialize and start server:', err);
    process.exit(1);
  }
}

startServer();

export { app };
export default app;
