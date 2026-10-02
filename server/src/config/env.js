import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crm_platform',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_development_jwt_secret_key_32chars',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_development_refresh_secret_key_32chars',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  COMPANY_NAME: process.env.COMPANY_NAME || 'NexusCRM Technologies',
  COMPANY_EMAIL: process.env.COMPANY_EMAIL || 'admin@nexuscrm.io',
};
