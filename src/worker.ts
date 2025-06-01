import { Worker, Job } from 'bullmq';
import { EventProcessorService } from './services/EventProcessor';
import { WEBHOOK_JOB_QUEUE_NAME, workerOptions } from './configs/bullMqConfig';
import dotenv from 'dotenv';
import { connectToMongoDb } from './utils/mongoUtils';
import { shutdown } from './utils/shutDownUtils';
import './models/PartnerModels';
import './models/SubscriptionModel';
import { EventJobPayload } from './types/event';
import { logger } from './utils/loggerUtils';
import { WebhookClient } from './services/WebhookClient';
import { WEBHOOK_CONFIG } from './configs/webhookConfig';
import { AxiosInstanceManager } from './utils/axiosInstanceManager';

dotenv.config();

async function startWorker(): Promise<void> {
  await connectToMongoDb();

  const axiosManager = new AxiosInstanceManager(WEBHOOK_CONFIG.requestTimeoutMs);
  const axiosInstance = axiosManager.getInstance();

  const webhookClient = new WebhookClient(WEBHOOK_CONFIG, axiosInstance);
  const eventProcessor = new EventProcessorService(webhookClient);

  const worker = new Worker<EventJobPayload, any, string>(
    WEBHOOK_JOB_QUEUE_NAME,
    async (job: Job<EventJobPayload, any, string>): Promise<void> => {
      try {

        await eventProcessor.processEvent(job.data);
      } catch (error) {

        throw error;
      }
    },
    workerOptions
  );

  worker.on('completed', (job: Job) => {
    logger.info(`[JOB ${job.id}] Completed successfully`);
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    if (job) {
      logger.error(`[JOB ${job.id}] Failed: ${err.message}`);
      logger.error(`[JOB ${job.id}] Attempt: ${job.attemptsMade}/${job.opts.attempts || 'unknown'}`);
    } else {
      logger.error(`Job failed but job object is undefined: ${err.message}`);
    }
  });

  worker.on('error', (err: Error) => {
    logger.error(`Worker error: ${err.message}`);
  });

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startWorker().catch((err) => {
  console.error('Failed to start BullMQ worker:', err);
  process.exit(1);
});
