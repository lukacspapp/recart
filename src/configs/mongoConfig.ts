import { logger } from '../utils/loggerUtils';
import dotenv from 'dotenv';

dotenv.config();

export const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  logger.error('MONGO_URI is not defined in environment variables.');
  process.exit(1);
}