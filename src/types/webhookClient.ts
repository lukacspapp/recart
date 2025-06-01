import { EventPayloadData } from "./event";

export interface WebhookClientConfig {
  maxAttempts: number;
  retryDelayMs: number;
  requestTimeoutMs: number;
}

export interface HeaderMetaData {
  eventId: string;
  eventType: string;
  signature: string;
}

export interface WebhookPayload {
  eventId: string;
  eventType: string;
  data: EventPayloadData;
}

export interface WebhookSendResult {
  success: boolean;
  statusCode?: number;
  partnerName: string;
  eventId: string;
  attempt: number;
  error?: string;
}

