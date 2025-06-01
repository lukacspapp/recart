import { Worker } from "bullmq";
import { logger } from "../loggerUtils";

export async function closeWorker(
  worker: Worker | undefined,
): Promise<void> {
  if (!worker) {
    logger.info(`worker not provided or already closed.`);
    return;
  }

  try {
    logger.info('Closing worker in drain mode');
    await worker.close(true);
    logger.info('worker closed successfully.');
  } catch (workerCloseError) {
    logger.error(`Error closing worker:`, workerCloseError instanceof Error
      ? workerCloseError.message
      : String(workerCloseError));
    throw workerCloseError;
  }
}
