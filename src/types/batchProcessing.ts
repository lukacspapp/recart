import { JobsOptions } from "bullmq";
import { EventJobPayload } from "./event";

export interface EventProcessingSuccessResult {
  eventId: string;
  eventType: string;
  status: 'success';
};

export interface EventProcessingFailedResult {
  eventId: string;
  eventType: string;
  status: 'failed';
  error: string;
};

export interface BatchProcessingResult {
  message: string;
  results: Array<{
    eventId: string;
    eventType: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
  hasErrors: boolean;
}

export interface BulkJobEntry {
  name: string;
  data: EventJobPayload;
  opts: JobsOptions;
}