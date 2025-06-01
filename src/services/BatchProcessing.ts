import { Queue } from 'bullmq';
import { logger } from '../utils/loggerUtils';
import { generateUniqueId } from '../utils/generateUniqueId';
import { EventBatch } from '../types/event';
import { BatchProcessingResult, EventProcessingSuccessResult, EventProcessingFailedResult, BulkJobEntry } from '../types/batchProcessing';

export class BatchProcessingService {
  private queue: Queue;

  constructor(queue: Queue) {
    this.queue = queue;
  }

  public async processBatch(events: EventBatch): Promise<BatchProcessingResult> {
    const timestamp = new Date().toISOString();

    const bulkJobs: BulkJobEntry[] = [];
    const eventIds: string[] = [];

    for (const event of events) {
      const { eventType, data } = event;
      const eventId = generateUniqueId();
      eventIds.push(eventId);

      const bulkJobEntry = BatchProcessingService.createBulkJobEntry(eventType, data, eventId, timestamp);
      bulkJobs.push(bulkJobEntry);
    }

    try {
      const jobResults = await this.queue.addBulk(bulkJobs);

      return BatchProcessingService.createSuccessfulResponse(jobResults, events);
    } catch (error) {
      logger.error(`Failed to enqueue batch: ${error instanceof Error ? error.message : 'Unknown error'}`);

      return BatchProcessingService.createErrorResponse(events, eventIds, error);
    }
  }

  private static createBulkJobEntry(eventType: string, data: any, eventId: string, timestamp: string): BulkJobEntry {
    return {
      name: `event:${eventType}`,
      data: { eventId, eventType, data, timestamp },
      opts: { jobId: eventId }
    };
  }

  private static createSuccessfulResponse(jobResults: any[], events: EventBatch): BatchProcessingResult {
    const results: EventProcessingSuccessResult[] = [];

    for (let i = 0; i < jobResults.length; i++) {
      const eventId = jobResults[i].id;
      const eventType = events[i].eventType;

      results.push({
        eventId,
        eventType,
        status: 'success'
      });
    }

    return {
      message: `All ${results.length} events successfully enqueued`,
      results,
      hasErrors: false
    };
  }

  private static createErrorResponse(events: EventBatch, eventIds: string[], error: unknown): BatchProcessingResult {
    const results: EventProcessingFailedResult[] = [];
    const errorMessage = error instanceof Error ? error.message : 'Failed to enqueue event';

    for (let i = 0; i < events.length; i++) {
      const eventType = events[i].eventType;
      const eventId = eventIds[i];

      results.push({
        eventId,
        eventType,
        status: 'failed',
        error: errorMessage
      });
    }

    return {
      message: `Some events failed to enqueue: ${errorMessage}`,
      results,
      hasErrors: true
    };
  }

}