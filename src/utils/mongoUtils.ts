import mongoose from "mongoose";
import { MONGO_URI } from "../configs/mongoConfig";
import { logger } from "./loggerUtils";

export async function connectToMongoDb(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('MongoDB connected successfully.');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected.');
});

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB runtime error:', error);
});