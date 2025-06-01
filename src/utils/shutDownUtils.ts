import { Worker } from "bullmq";
import { logger } from "./loggerUtils";
import { redisClient } from "./redisUtils";

export const shutdown = async (worker: Worker) => {
  logger.info('BullMQ Worker shutting down');
  if (redisClient.status === 'ready' || redisClient.status === 'connecting') {

    await redisClient.quit();
    logger.info('Worker dedicated Redis client disconnected.');
  }

  await worker.close();
  logger.info('BullMQ Worker closed.');
  process.exit(0);
};