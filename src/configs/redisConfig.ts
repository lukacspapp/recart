import { logger } from '../utils/loggerUtils';
import dotenv from 'dotenv';

dotenv.config();

export const REDIS_URL = process.env.REDIS_URL as string;

if (!REDIS_URL) {
  logger.error('REDIS_URL is not defined in environment variables.');
  process.exit(1);
}

export const redisConnectionOptions = {
  enableReadyCheck: true,
  maxRetriesPerRequest: null
};
