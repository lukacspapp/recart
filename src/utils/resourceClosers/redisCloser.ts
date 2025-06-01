import Redis from "ioredis";
import { logger } from "../loggerUtils";

export async function closeRedisClient(redisClient: Redis | undefined, clientName: string = 'Redis'): Promise<void> {
  if (redisClient?.status === 'ready' || redisClient?.status === 'connecting' || redisClient?.status === 'connect') {
    try {
      logger.info(`Attempting to close ${clientName} client connection...`);

      await redisClient.quit();
      logger.info(`${clientName} client connection closed successfully.`);
    } catch (redisCloseError) {

      logger.error(`Error closing ${clientName} client:`, redisCloseError);
    }
  } else {

    logger.info(`${clientName} client already closed, not connected, or not provided.`);
  }
}
