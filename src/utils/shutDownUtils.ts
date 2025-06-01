import { Worker } from "bullmq";
import { logger } from "./loggerUtils";
import { redisClient } from "./redisUtils";
import { SHUTDOWN_TIMEOUT_MS } from "../configs/appConfig";
import { closeRedisClient } from "./resourceClosers/redisCloser";
import { closeMongoConnection } from "./resourceClosers/mongoCloser";
import { closeWorker } from "./resourceClosers/bullMQCloser";


export function createGracefulShutdown(worker: Worker) {
  let isShuttingDown = false;

  return async function shutdown() {
    if (isShuttingDown) {
      logger.info('Shutdown already in progress...');
      return;
    }

    isShuttingDown = true;
    logger.info('Graceful shutdown initiated...');

    const shutdownTimeout = setTimeout(() => {
      logger.error(`Shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms. Forcing exit.`);
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    shutdownTimeout.unref();

    try {
      await closeWorker(worker)

      await closeRedisClient(redisClient);

      await closeMongoConnection();

      clearTimeout(shutdownTimeout);

      logger.info('Graceful shutdown completed.');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  };
}
