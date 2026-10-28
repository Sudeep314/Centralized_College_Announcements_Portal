import dotenv from 'dotenv';

// Load environment variables before importing app and database config
dotenv.config();

// Startup validation of critical environment variables
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((varName) => !process.env[varName]);

if (missingEnv.length > 0) {
  console.error('===============================================================');
  console.error('FATAL ERROR: Missing required environment variables in .env:');
  missingEnv.forEach((varName) => console.error(`  - ${varName}`));
  console.error('Please configure them in backend/.env before starting the server.');
  console.error('===============================================================');
  process.exit(1);
}

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP server
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log('===============================================================');
      console.log(`🚀 CampusNotice API Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📢 Announcements API: http://localhost:${PORT}/api/announcements`);
      console.log(`🔐 Admin Login API: http://localhost:${PORT}/api/auth/login`);
      console.log('===============================================================');
    });

    // Handle unexpected unhandled rejections
    process.on('unhandledRejection', (err) => {
      console.error('[Unhandled Rejection]', err.message);
      server.close(() => process.exit(1));
    });

    // Handle process termination (e.g., Ctrl+C)
    process.on('SIGINT', () => {
      console.log('\nGracefully shutting down CampusNotice API server...');
      server.close(() => {
        console.log('Server terminated cleanly.');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
