import { injectable } from 'inversify';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from './loggerUtils';
import { HeaderMetaData } from '../types/webhookClient';

@injectable()
export class AxiosInstanceManager {
  private axiosInstance: AxiosInstance;

  constructor(timeout: number) {
    this.axiosInstance = axios.create({
      timeout
    });

    this.setupInterceptors();
  }

  public getInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  public createRequestConfig(options: {
    timeout?: number;
    webhookMetadata?: HeaderMetaData;
    customHeaders?: Record<string, string>;
  } = {}): AxiosRequestConfig {
    const { timeout, webhookMetadata, customHeaders } = options;

    const config: AxiosRequestConfig = {};

    if (timeout) {
      config.timeout = timeout;
    }

    if (webhookMetadata) {
      config.headers = this.createWebhookHeaders(webhookMetadata);
    } else if (customHeaders) {
      config.headers = customHeaders;
    }

    return config;
  }

  public async post<T>(
    url: string,
    data: T,
    options: {
      webhookMetadata?: HeaderMetaData;
      customHeaders?: Record<string, string>;
      timeout?: number;
    } = {}
  ): Promise<AxiosResponse<T>> {
    const config = this.createRequestConfig(options);
    return this.axiosInstance.post<T>(url, data, config);
  }

  private createWebhookHeaders(metadata: HeaderMetaData) {
    return {
      'Content-Type': 'application/json',
      'X-Recart-Event-Id': metadata.eventId,
      'X-Recart-Event-Type': metadata.eventType,
      'X-Recart-Signature-256': metadata.signature,
    };
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            logger.error(`HTTP error ${error.response.status}: ${error.message}`);
          } else {
            logger.error(`Network error: ${error.message}`);
          }
        } else {
          logger.error('Unknown error:', error);
        }
        return Promise.reject(error);
      }
    );
  }
}
