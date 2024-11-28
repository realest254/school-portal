import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import config from './config/production';
import adminRoutes from './routes/admin.routes';
import profileRoutes from './routes/profile.routes';
import teacherRoutes from './routes/teacher.routes';
import inviteRoutes from './routes/invite.routes';
import subjectRoutes from './routes/subject.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { rateLimiter, securityHeaders, compressionMiddleware } from './middlewares/security.middleware';
import SchedulerService from './services/scheduler.service'; // Assuming SchedulerService is defined in this file

dotenv.config();

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(rateLimiter);
app.use(compressionMiddleware);

// CORS configuration
app.use(cors({
  origin: config.server.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Initialize scheduler
const schedulerService = new SchedulerService();
schedulerService.startNotificationExpiryJob();

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(config.server.port, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${config.server.port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
