import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import announcementRoutes from './routes/announcementRoutes.js';
import authRoutes from './routes/authRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Basic HTTP security headers with Helmet (allow cross-origin resource access for uploaded media)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. CORS configuration
// Allows requests from the frontend developer's local server (e.g. Live Server on 5500)
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5500';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      
      // Allow configured client origin or any local dev port (localhost / 127.0.0.1)
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (origin === allowedOrigin || isLocalhost) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// 3. Body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Serve static uploaded files (images, PDFs)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 4. Health Check Endpoints (Available at both /health and /api/health)
const healthHandler = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CampusNotice Backend API is healthy and operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// 5. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/upload', uploadRoutes);

// 6. Catch-all route for unmatched endpoints (404)
app.use(notFound);

// 7. Centralized Error Handler (500, validation, cast errors)
app.use(errorHandler);

export default app;
