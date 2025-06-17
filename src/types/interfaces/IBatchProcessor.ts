import { BatchProcessingResult } from "../batchProcessing";
import { EventBatch } from "../event";

export interface IBatchProcessor {
  processBatch(events: EventBatch): Promise<BatchProcessingResult>;
}
