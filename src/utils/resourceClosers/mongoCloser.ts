import mongoose from "mongoose";
import { logger } from "../loggerUtils";

export async function closeMongoConnection(): Promise<void> {
  if (mongoose.connection?.readyState === 1 || mongoose.connection?.readyState === 2) {
    try {
      logger.info('Attempting to close MongoDB connection...');

      await mongoose.connection.close();
      logger.info('MongoDB connection closed successfully.');
    } catch (dbCloseError) {

      logger.error('Error closing MongoDB connection:', dbCloseError);
    }
  } else {

    logger.info('MongoDB connection already closed or not established.');
  }
}