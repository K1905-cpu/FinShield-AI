import express from 'express';
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
process.on('uncaughtException', (err) => {
    console.error('SERVER UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('SERVER UNHANDLED REJECTION:', reason);
});
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
const healthHandler = (_req, res) => {
    res.json({
        status: 'online',
        platform: 'FinShield AI',
        version: '1.0.0',
        mode: 'Intelligent Fraud & Risk Detection Platform',
        transactionsCount: db.getState().transactions.length,
        usersCount: db.getState().users.length
    });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);
// API Routes (mounted with /api/... and /... for maximum resilience on Vercel)
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/transactions', transactionsRouter);
app.use('/api/fraud', fraudRouter);
app.use('/fraud', fraudRouter);
app.use('/api/alerts', alertsRouter);
app.use('/alerts', alertsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/analytics', analyticsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/dashboard', dashboardRouter);
app.use('/api/personal-finance', personalFinanceRouter);
app.use('/personal-finance', personalFinanceRouter);
app.use('/api/simulation', simulationRouter);
app.use('/simulation', simulationRouter);
app.use('/api/admin', adminRouter);
app.use('/admin', adminRouter);
app.use('/api/reports', reportsRouter);
app.use('/reports', reportsRouter);
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// JSON 404 Handler for unmatched API routes
app.use((req, res) => {
    res.status(404).json({ error: `API route ${req.originalUrl} not found` });
});
// Startup & Auto-seed
async function startServer() {
    try {
        if (!db.isSeeded()) {
            console.log('Database not yet seeded. Initializing transactions...');
            await seedDatabase(false);
        }
        if (!process.env.VERCEL || process.env.PORT) {
            app.listen(PORT, () => {
                console.log(`=======================================================`);
                console.log(`  FinShield AI Server is running on port ${PORT}`);
                console.log(`  Health Check: http://localhost:${PORT}/api/health`);
                console.log(`  Database: ${db.getState().transactions.length} transactions loaded`);
                console.log(`=======================================================`);
            });
        }
    }
    catch (err) {
        console.error('Initialization notice:', err);
    }
}
// Start listener in local development OR in environments where PORT is provided (e.g. Vercel Services)
if (!process.env.VERCEL || process.env.PORT) {
    startServer();
}
export { app };
export default app;
