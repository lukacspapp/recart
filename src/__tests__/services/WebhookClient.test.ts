import { Container } from 'inversify';
import mongoose from 'mongoose';
import { WebhookClient } from '../../services/WebhookClient';
import { EventPayloadData } from '../../types/event';
import { WebhookClientConfig } from '../../types/webhookClient';
import { generateSignature } from '../../utils/generateUniqueId';
import { IHttpClient } from '../../types/interfaces/IHttpClient';
import { TYPES } from '../../types/inversify';
import axios from 'axios';

jest.mock('../../utils/generateUniqueId', () => ({
  generateSignature: jest.fn().mockReturnValue('mocked-signature-123'),
}));

jest.mock('axios', () => {
  return {
    isAxiosError: jest.fn(),
  };
});

describe('WebhookClient', () => {
  let container: Container;
  let mockHttpClient: jest.Mocked<IHttpClient>;
  let webhookClient: WebhookClient;
  let webhookConfig: WebhookClientConfig;
  let mockPartner: any;
  let eventData: EventPayloadData;

  beforeEach(() => {
    jest.clearAllMocks();

    mockHttpClient = {
      post: jest.fn(),
      createRequestWithWebhookHeaders: jest.fn(),
    } as jest.Mocked<IHttpClient>;

    webhookConfig = {
      maxAttempts: 3,
      retryDelayMs: 10,
      requestTimeoutMs: 1000,
    };

    container = new Container();
    container.bind<WebhookClientConfig>(TYPES.WebhookConfig).toConstantValue(webhookConfig);
    container.bind<IHttpClient>(TYPES.HttpClient).toConstantValue(mockHttpClient);
    container.bind<WebhookClient>(WebhookClient).toSelf();

    webhookClient = container.get<WebhookClient>(WebhookClient);

    mockPartner = {
      _id: new mongoose.Types.ObjectId('62e0125dfb5538abcdef1234'),
      name: 'Test Partner',
      webhookUrl: 'https://example.com/webhook',
      secretKey: 'partner-secret-key',
      isActive: true,
    };

    eventData = {
      orderId: 'order-123',
      value: 99.99,
    };

    (axios.isAxiosError as unknown as jest.Mock).mockImplementation((error) => {
      return error && error.__AXIOS_ERROR__ === true;
    });
  });

  describe('sendWebhook', () => {
    it('should successfully deliver webhook on first attempt', async () => {
      mockHttpClient.createRequestWithWebhookHeaders.mockResolvedValueOnce({
        status: 200,
        headers: {},
        data: {},
        statusText: 'OK',
        config: {} as any,
      });

      const result = await webhookClient.sendWebhook(
        mockPartner,
        'order.created',
        eventData,
        'event-123'
      );

      expect(generateSignature).toHaveBeenCalledWith(
        expect.stringContaining('order.created'),
        mockPartner.secretKey
      );

      expect(mockHttpClient.createRequestWithWebhookHeaders).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.createRequestWithWebhookHeaders).toHaveBeenCalledWith(
        mockPartner.webhookUrl,
        expect.stringContaining('order.created'),
        {
          eventId: 'event-123',
          eventType: 'order.created',
          signature: 'mocked-signature-123'
        },
        webhookConfig.requestTimeoutMs
      );

      expect(result).toEqual({
        success: true,
        statusCode: 200,
      });
    });

    it('should retry on failed attempts and succeed eventually', async () => {
      mockHttpClient.createRequestWithWebhookHeaders
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          status: 200,
          headers: {},
          data: {},
          statusText: 'OK',
          config: {} as any,
        });

      const result = await webhookClient.sendWebhook(
        mockPartner,
        'order.created',
        eventData,
        'event-123'
      );

      expect(mockHttpClient.createRequestWithWebhookHeaders).toHaveBeenCalledTimes(2);

      expect(result).toEqual({
        success: true,
        statusCode: 200,
      });
    });

    it('should return error response after max retries', async () => {
      const axiosError = new Error('Request failed') as any;
      axiosError.__AXIOS_ERROR__ = true;
      axiosError.response = {
        status: 500,
        data: 'Server Error',
      };

      mockHttpClient.createRequestWithWebhookHeaders.mockRejectedValue(axiosError);

      const result = await webhookClient.sendWebhook(
        mockPartner,
        'order.created',
        eventData,
        'event-123'
      );

      expect(mockHttpClient.createRequestWithWebhookHeaders).toHaveBeenCalledTimes(webhookConfig.maxAttempts);

      expect(result).toEqual({
        success: false,
        statusCode: 500,
        error: expect.stringContaining('Request failed with status code 500'),
      });
    });

    it('should handle timeout errors correctly', async () => {
      const timeoutError = new Error('Timeout') as any;
      timeoutError.__AXIOS_ERROR__ = true;
      timeoutError.code = 'ETIMEDOUT';

      mockHttpClient.createRequestWithWebhookHeaders.mockRejectedValue(timeoutError);

      const result = await webhookClient.sendWebhook(
        mockPartner,
        'order.created',
        eventData,
        'event-123'
      );

      expect(result).toEqual({
        success: false,
        statusCode: 500,
        error: expect.stringContaining(`Request timed out after ${webhookConfig.requestTimeoutMs}ms`),
      });
    });

    it('should handle non-2xx status codes as errors', async () => {
      mockHttpClient.createRequestWithWebhookHeaders.mockResolvedValue({
        status: 429,
        headers: {},
        data: {},
        statusText: 'Too Many Requests',
        config: {} as any,
      });

      const result = await webhookClient.sendWebhook(
        mockPartner,
        'order.created',
        eventData,
        'event-123'
      );

      expect(mockHttpClient.createRequestWithWebhookHeaders).toHaveBeenCalledTimes(webhookConfig.maxAttempts);

      expect(result).toEqual({
        success: false,
        statusCode: 429,
        error: 'Failed with status code 429',
      });
    });

    it('should handle non-axios errors', async () => {
      const genericError = new Error('Something unexpected happened');

      mockHttpClient.createRequestWithWebhookHeaders.mockRejectedValue(genericError);

      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);

      const result = await webhookClient.sendWebhook(
        mockPartner,
        'order.created',
        eventData,
        'event-123'
      );

      expect(result).toEqual({
        success: false,
        statusCode: 500,
        error: 'Something unexpected happened',
      });
    });
  });
});
