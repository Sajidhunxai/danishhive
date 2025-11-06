import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import profileRoutes from './routes/profile.routes';
import jobRoutes from './routes/job.routes';
import applicationRoutes from './routes/application.routes';
import contractRoutes from './routes/contract.routes';
import messageRoutes from './routes/message.routes';
import forumRoutes from './routes/forum.routes';
import paymentRoutes from './routes/payment.routes';
import referralRoutes from './routes/referral.routes';
import languageSkillRoutes from './routes/language-skill.routes';
import earningRoutes from './routes/earning.routes';
import honeyRoutes from './routes/honey.routes';
import couponRoutes from './routes/coupon.routes';
import adminRoutes from './routes/admin.routes';
import verificationRoutes from './routes/verification.routes';
import uploadRoutes from './routes/upload.routes';
import gdprRoutes from './routes/gdpr.routes';
import imageApprovalRoutes from './routes/imageApproval.routes';
import reportRoutes from './routes/report.routes';
import refundRoutes from './routes/refund.routes';
import universityRoutes from './routes/university.routes';
import under18Routes from './routes/under18.routes';
import translationRoutes from './routes/translation.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Security middleware - configure helmet to allow images from cross-origin
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow embedding images
  crossOriginOpenerPolicy: false, // Allow opening images
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded from different origins
}));
app.use(compression());

// CORS configuration - Allow multiple origins
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://localhost:5000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Content-Length', 'Cache-Control', 'ETag'],
}));

// Rate limiting - more lenient for admin endpoints (apply first)
const adminLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.ADMIN_RATE_LIMIT_MAX_REQUESTS || '300'), // Higher limit for admin
  message: 'Too many admin requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting - general API limit (exclude admin routes)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin routes (they have their own limiter)
    // req.path will be like '/admin/users/with-email' when applied to '/api/'
    return req.path.startsWith('/admin');
  }
});

// Apply admin rate limiter first (more specific routes first)
app.use('/api/admin', adminLimiter);

// Apply general rate limiter to all other API routes
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve uploaded files from the backend/uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/language-skills', languageSkillRoutes);
app.use('/api/earnings', earningRoutes);
app.use('/api/honey', honeyRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/image-approval', imageApprovalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/under18', under18Routes);
app.use('/api/translations', translationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const error = err as Error & { status?: number; stack?: string };
  console.error(error.stack);
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
});

export default app;

