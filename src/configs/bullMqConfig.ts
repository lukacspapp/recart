import { QueueOptions } from 'bullmq';
import { redisClient } from '../utils/redisUtils';

export const WEBHOOK_JOB_QUEUE_NAME = 'webhook-job-queue';

export const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);

export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000, // 5s, 10s, 20s
  } as const, // Ensures type safety for backoff strategy
  removeOnComplete: {
    count: 1000, // Keep last 1000 completed jobs
    age: 24 * 60 * 60, // Keep for 24 hours
  },
  removeOnFail: {
    count: 5000, // Keep last 5000 failed jobs
    age: 7 * 24 * 60 * 60, // Keep for 7 days
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
