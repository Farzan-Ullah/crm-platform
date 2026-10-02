import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimiterMiddleware.js';
import { AppError } from './utils/AppError.js';
import v1Routes from './routes/index.js';

const app = express();

// Trust proxy for secure cookies behind reverse proxy (e.g., Nginx)
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Let reverse proxy / SPA manage inline styles if needed
    crossOriginEmbedderPolicy: false,
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      const allowedOrigins = [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
      if (allowedOrigins.indexOf(origin) !== -1 || ENV.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Request body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie Parser for HTTP-only JWTs
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// HTTP request logger
const morganStream = {
  write: (message) => logger.info(message.trim()),
};
app.use(morgan('combined', { stream: morganStream }));

// General Rate Limiting
app.use('/api', apiLimiter);

// API v1 routes mounting
app.use('/api/v1', v1Routes);

// Health check endpoint at root
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Handle unhandled routes (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Endpoint '${req.originalUrl}' does not exist on this server.`, 404, 'NOT_FOUND'));
});

// Global Centralized Error Handler
app.use(errorHandler);

export default app;
