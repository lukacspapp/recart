import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { generateSignature } from '../utils/generateUniqueId';
import { EventPayloadData } from '../types/event';
import { HeaderMetaData, WebhookClientConfig, WebhookSendResult } from '../types/webhookClient';
import { Partner } from '../types/partner';

export class WebhookClient {
  private readonly config: WebhookClientConfig;
  private readonly axios: AxiosInstance;

  constructor(
    config: WebhookClientConfig,
    axios: AxiosInstance
  ) {
    this.config = config;
    this.axios = axios;
  }

  public async sendWebhook(partner: Partner, eventType: string, data: EventPayloadData, eventId: string): Promise<WebhookSendResult> {
    let attempts = 0;
    const payload = { eventId, eventType, data };
    const requestBody = JSON.stringify(payload);
    const signature = generateSignature(requestBody, partner.secretKey);

    while (attempts < this.config.maxAttempts) {
      attempts++;

      try {
        const { status } = await this.makeRequest(partner.webhookUrl, requestBody, {
          eventId,
          eventType,
          signature
        });

        if (status >= 200 && status < 300) {
          return WebhookClient.createSuccessResponse(
            status,
            partner.name,
            eventId,
            attempts
          );
        }

        if (attempts >= this.config.maxAttempts) {
          return WebhookClient.createErrorResponse(
            status,
            partner.name,
            eventId,
            attempts,
            `Failed with status code ${status}`
          );
        }
      } catch (error) {
        const errorDetails = this.parseError(error, this.config.requestTimeoutMs);

        if (attempts >= this.config.maxAttempts) {
          return WebhookClient.createErrorResponse(
            errorDetails.statusCode || 500,
            partner.name,
            eventId,
            attempts,
            errorDetails.message
          );
        }
      }

      await this.delay(attempts);
    }

    return {
      success: false,
      partnerName: partner.name,
      eventId,
      attempt: attempts,
      error: `Max retries reached for partner webhook.`
    };
  }

  private async makeRequest(url: string, body: string, metadata: HeaderMetaData) {
    const requestConfig: AxiosRequestConfig = {
      headers: this.createHeaders(metadata),
      timeout: this.config.requestTimeoutMs
    };

    return this.axios.post(url, body, requestConfig);
  }

  private static createSuccessResponse(statusCode: number, partnerName: string, eventId: string, attempts: number): WebhookSendResult {
    return {
      success: true,
      statusCode,
      partnerName,
      eventId,
      attempt: attempts
    }
  }

  private static createErrorResponse(statusCode: number, partnerName: string, eventId: string, attempts: number, error: string): WebhookSendResult {
    return {
      success: false,
      statusCode,
      partnerName,
      eventId,
      attempt: attempts,
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

  private createHeaders(metadata: HeaderMetaData) {
    return {
      'Content-Type': 'application/json',
      'X-Recart-Event-Id': metadata.eventId,
      'X-Recart-Event-Type': metadata.eventType,
      'X-Recart-Signature-256': metadata.signature,
    };
  }
}
