import { Response, Request } from 'express';
import { logger } from '../utils/loggerUtils';
import { webhookQueue } from '../utils/bullMqUtils';
import { EventBatch } from '../types/event';
import { BatchProcessingService } from '../services/BatchProcessing';

export async function submitEventToQueue(req: Request<unknown, unknown, EventBatch>, res: Response): Promise<void> {
  try {
    const batchProcessor = new BatchProcessingService(webhookQueue);
    const { message, results, hasErrors } = await batchProcessor.processBatch(req.body);

    const statusCode = hasErrors ? 207 : 202;

    res.status(statusCode).json({ message, results });
  } catch (error) {
    logger.error('EventController: Failed to process batch:', error);
    res.status(500).json('Internal Server Error');
  }
}
