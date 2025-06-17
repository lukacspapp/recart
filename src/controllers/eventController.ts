import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { logger } from '../utils/loggerUtils';
import { EventBatch } from '../types/event';
import { IBatchProcessor } from '../types/interfaces/IBatchProcessor';
import { TYPES } from '../types/inversify';

@injectable()
export class EventController {
  constructor(
    @inject(TYPES.BatchProcessor) private readonly batchProcessor: IBatchProcessor
  ) {}

  public async submitEventToQueue(req: Request<unknown, unknown, EventBatch>, res: Response): Promise<void> {
    try {
      const { message, results, hasErrors } = await this.batchProcessor.processBatch(req.body);

      const statusCode = hasErrors ? 207 : 202;

      res.status(statusCode).json({ message, results });
    } catch (error) {
      logger.error('EventController: Failed to process batch:', error);
      res.status(500).json('Internal Server Error');
    }
  }
}
