import { Queue, Worker } from "bullmq";
import { logger } from "../loggerUtils";

export async function closeBullMqQueue(queue: Queue | undefined, queueName: string = 'BullMQ Queue'): Promise<void> {
  if (queue) {
    try {
      logger.info(`Attempting to close ${queueName} (name: ${queue.name})...`);

      await queue.close();
      logger.info(`${queueName} (name: ${queue.name}) closed successfully.`);
    } catch (queueCloseError) {

      logger.error(`Error closing ${queueName} (name: ${queue.name}):`, queueCloseError);
    }
  } else {

    logger.info(`${queueName} instance not provided or already handled.`);
  }
}

export async function closeBullMqWorker(worker: Worker | undefined, workerName: string = 'BullMQ Worker'): Promise<void> {
  if (worker) {
    try {
      logger.info(`Attempting to close ${workerName} for queue ${worker.name}...`);

      await worker.close();
      logger.info(`${workerName} for queue ${worker.name} closed successfully.`);
    } catch (workerCloseError) {

      logger.error(`Error closing ${workerName} for queue ${worker.name}:`, workerCloseError);
    }
  } else {

    logger.info(`${workerName} instance not provided or already handled.`);
  }
}