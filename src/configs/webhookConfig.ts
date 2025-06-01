import { WebhookClientConfig } from "../types/webhookClient";

const WEBHOOK_MAX_ATTEMPTS = parseInt(process.env.WEBHOOK_MAX_ATTEMPTS || '3', 10);
const WEBHOOK_RETRY_DELAY_MS = parseInt(process.env.WEBHOOK_RETRY_DELAY || '2500', 10);
const WEBHOOK_TIMEOUT_MS = parseInt(process.env.WEBHOOK_TIMEOUT || '5000', 10);

export const WEBHOOK_CONFIG: WebhookClientConfig = {
  maxAttempts: WEBHOOK_MAX_ATTEMPTS,
  retryDelayMs: WEBHOOK_RETRY_DELAY_MS,
  requestTimeoutMs: WEBHOOK_TIMEOUT_MS,
};

