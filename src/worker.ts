import 'reflect-metadata';
import { Worker, Job } from 'bullmq';
import { WEBHOOK_JOB_QUEUE_NAME, workerOptions } from './configs/bullMqConfig';
import dotenv from 'dotenv';
import { connectToMongoDb } from './utils/mongoUtils';
import { createGracefulShutdown } from './utils/shutDownUtils';
import './models/PartnerModels';
import './models/SubscriptionModel';
import { EventJobPayload } from './types/event';
import { logger } from './utils/loggerUtils';
import { container } from './di/container';
import { IEventProcessor } from './types/interfaces/IEventProcessor';
import { TYPES } from './types/inversify';

dotenv.config();

async function startWorker(): Promise<void> {
  await connectToMongoDb();

  const eventProcessor = container.get<IEventProcessor>(TYPES.EventProcessor);

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

  const gracefulShutdown = createGracefulShutdown(worker);

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

startWorker().catch((err) => {
  console.error('Failed to start BullMQ worker:', err);
  process.exit(1);
});
