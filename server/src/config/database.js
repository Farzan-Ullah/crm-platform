import mongoose from 'mongoose';
import { ENV } from './env.js';
import { logger } from './logger.js';

export const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI, {
      autoIndex: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection lost. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error occurred: ${err.message}`);
});
