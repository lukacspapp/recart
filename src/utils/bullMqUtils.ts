import { Queue } from "bullmq";
import { WEBHOOK_JOB_QUEUE_NAME, queueOptions } from "../configs/bullMqConfig";
import { logger } from "./loggerUtils";
import { EventJobPayload } from "../types/event";

export const webhookQueue = new Queue<EventJobPayload, any, string>(
  WEBHOOK_JOB_QUEUE_NAME,
  queueOptions
);

webhookQueue.on('error', (error: Error) => {
  logger.error(`BullMQ Queue (${WEBHOOK_JOB_QUEUE_NAME}) error:`, error);
});
