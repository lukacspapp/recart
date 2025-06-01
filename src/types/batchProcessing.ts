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
}

type EventProcessingResult =
  | EventProcessingSuccessResult
  | EventProcessingFailedResult;

export interface BatchProcessingResult {
  message: string;
  results: EventProcessingResult[];
  hasErrors: boolean;
}

export interface BulkJobEntry {
  name: string;
  data: EventJobPayload;
  opts: JobsOptions;
}