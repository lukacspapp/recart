import Redis from "ioredis";
import { logger } from "../loggerUtils";

export async function closeRedisClient(redisClient: Redis | undefined): Promise<void> {
  const activeStates = ['ready', 'connecting', 'connect'];

  if (!redisClient || !activeStates.includes(redisClient.status)) {
    logger.info('Redis client already closed, not connected, or not provided.');
    return;
  }

  try {
    logger.info('Attempting to close Redis client connection...');

    await redisClient.quit();
    logger.info('Redis client connection closed successfully.');
  } catch (redisCloseError) {

    logger.error(`Error closing Redis client:`, redisCloseError);
  }
}