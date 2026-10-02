import app from './src/app.js';
import { ENV } from './src/config/env.js';
import { logger } from './src/config/logger.js';
import { connectDatabase } from './src/config/database.js';
import { initReminderService } from './src/queues/reminderQueue.js';
import { initCampaignService } from './src/queues/campaignQueue.js';

let server;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();

    // 2. Initialize Reminder Queue / Scheduler
    await initReminderService();

    // 3. Initialize Campaign Queue / Scheduler
    await initCampaignService();

    // 4. Start HTTP listener
    server = app.listen(ENV.PORT, () => {
      logger.info(`====================================================`);
      logger.info(`  NexusCRM Server running in [${ENV.NODE_ENV}] mode`);
      logger.info(`  Listening on: http://localhost:${ENV.PORT}`);
      logger.info(`  Client URL:   ${ENV.CLIENT_URL}`);
      logger.info(`====================================================`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down gracefully...', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down immediately...', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// Graceful termination
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Closing HTTP server gracefully...');
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed. Exiting process.');
      process.exit(0);
    });
  }
});
