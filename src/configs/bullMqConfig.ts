import { QueueOptions } from 'bullmq';
import { redisClient } from '../utils/redisUtils';

export const WEBHOOK_JOB_QUEUE_NAME = 'webhook-job-queue';

export const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);

export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  } as const,
  removeOnComplete: {
    count: 1000,
    age: 24 * 60 * 60,
  },
  removeOnFail: {
    count: 5000,
    age: 7 * 24 * 60 * 60,
  },
};

export const queueOptions: QueueOptions = {
  connection: redisClient,
  defaultJobOptions: defaultJobOptions,
};

export const workerOptions = {
  connection: redisClient,
  concurrency: WORKER_CONCURRENCY,
  limiter: { max: 100, duration: 10000 },
};
