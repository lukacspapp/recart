import { injectable, inject } from 'inversify';
import axios from 'axios';
import { generateSignature } from '../utils/generateUniqueId';
import { EventPayloadData } from '../types/event';
import { WebhookClientConfig, WebhookDeliveryResult, WebhookErrorResult, WebhookSuccessResult } from '../types/webhookClient';
import { Partner } from '../types/partner';
import { IWebhookClient } from '../types/interfaces/IWebhookClient';
import { IHttpClient } from '../types/interfaces/IHttpClient';
import { TYPES } from '../types/inversify';

@injectable()
export class WebhookClient implements IWebhookClient {
  constructor(
    @inject(TYPES.WebhookConfig) private readonly config: WebhookClientConfig,
    @inject(TYPES.HttpClient) private readonly httpClient: IHttpClient
  ) { }

  public async sendWebhook(partner: Partner, eventType: string, data: EventPayloadData, eventId: string): Promise<WebhookDeliveryResult> {
    let attempts = 0;
    const payload = { eventId, eventType, data };
    const requestBody = JSON.stringify(payload);

    const signature = generateSignature(requestBody, partner.secretKey);
    const metadata = {
      eventId,
      eventType,
      signature
    }

    while (attempts < this.config.maxAttempts) {
      attempts++;

      try {
        const { status } = await this.httpClient.createRequestWithWebhookHeaders(
          partner.webhookUrl,
          requestBody,
          metadata,
          this.config.requestTimeoutMs
        );

        if (status >= 200 && status < 300) {
          return WebhookClient.createSuccessResponse(status);
        }

        if (attempts >= this.config.maxAttempts) {
          return WebhookClient.createErrorResponse(
            status,
            `Failed with status code ${status}`
          );
        }
      } catch (error) {
        const errorDetails = this.parseError(error, this.config.requestTimeoutMs);

        if (attempts >= this.config.maxAttempts) {
          return WebhookClient.createErrorResponse(
            errorDetails.statusCode || 500,
            errorDetails.message
          );
        }
      }

      await this.delay(attempts);
    }

    return {
      success: false,
      error: `Max retries reached for partner webhook.`
    };
  }

  private static createSuccessResponse(statusCode: number): WebhookSuccessResult {
    return {
      success: true,
      statusCode,
    }
  }

  private static createErrorResponse(statusCode: number, error: string): WebhookErrorResult {
    return {
      success: false,
      statusCode,
      error,
    };
  }

  private parseError(error: unknown, timeoutMs: number): { message: string; statusCode?: number } {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return {
          message: `Request failed with status code ${error.response.status}`,
          statusCode: error.response.status
        };
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return {
          message: `Request timed out after ${timeoutMs}ms`
        };
      }

      return { message: error.message };
    }

    return {
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }

  private async delay(attemptNumber: number): Promise<void> {
    const delayMs = this.config.retryDelayMs * Math.pow(2, attemptNumber - 1);
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
