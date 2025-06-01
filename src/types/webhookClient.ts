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

export type WebhookDeliveryResult = WebhookSuccessResult | WebhookErrorResult;
export interface WebhookSuccessResult {
  success: true;
  statusCode: number;
}
export interface WebhookErrorResult {
  success: false;
  statusCode?: number;
  error: string;
}