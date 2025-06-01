import Redis from "ioredis";
import { REDIS_URL, redisConnectionOptions } from "../configs/redisConfig";
import { logger } from "./loggerUtils";

export const redisClient = new Redis(REDIS_URL, redisConnectionOptions);

redisClient.on('connect', () => logger.info('Worker dedicated Redis client successfully connected.'));

redisClient.on('error', (err) => logger.error('Worker dedicated Redis client connection error:', err));

redisClient.on('ready', () => logger.info('Worker dedicated Redis client is ready.'));
