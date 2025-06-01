import mongoose from "mongoose";
import { logger } from "../loggerUtils";

export async function closeMongoConnection(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    logger.info('MongoDB connection is already closed or not established.');
    return;
  }

  try {
    logger.info('Disconnecting from MongoDB...');

    await mongoose.connection.close();
    logger.info('MongoDB disconnected successfully.');
  } catch (mongoCloseError) {

    logger.error('Error closing MongoDB connection:', mongoCloseError);
  }
}
