import axios, { AxiosInstance, AxiosResponse, AxiosRequestHeaders } from 'axios';
import mongoose from 'mongoose';
import { WebhookClient } from '../../services/WebhookClient';
import { EventPayloadData } from '../../types/event';
import { WebhookClientConfig } from '../../types/webhookClient';
import { generateSignature } from '../../utils/generateUniqueId';

jest.mock('../../utils/generateUniqueId', () => ({
  generateSignature: jest.fn().mockReturnValue('mocked-signature-123'),
}));

jest.mock('axios', () => {
  return {
    isAxiosError: jest.fn(),
    create: jest.fn().mockReturnValue({
      post: jest.fn(),
    }),
  };
});

describe('WebhookClient', () => {
  let mockAxios: jest.Mocked<AxiosInstance>;
  let webhookClient: WebhookClient;
  let webhookConfig: WebhookClientConfig;
  let mockPartner: any;
  let eventData: EventPayloadData;

  const createMockResponse = (status: number): Partial<AxiosResponse> => ({
    status,
    headers: {},
    data: {},
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    config: {
      headers: {
        'Content-Type': 'application/json',
        'X-Recart-Event-Id': 'event-123',
        'X-Recart-Event-Type': 'order.created',
        'X-Recart-Signature-256': 'mocked-signature-123',
      } as unknown as AxiosRequestHeaders
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockAxios = {
      post: jest.fn(),
    } as unknown as jest.Mocked<AxiosInstance>;

    webhookConfig = {
      maxAttempts: 3,
      retryDelayMs: 10,
      requestTimeoutMs: 1000,
    };

    webhookClient = new WebhookClient(webhookConfig, mockAxios);

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
      mockAxios.post.mockResolvedValueOnce(createMockResponse(200));

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

      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      expect(mockAxios.post).toHaveBeenCalledWith(
        mockPartner.webhookUrl,
        expect.stringContaining('order.created'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Recart-Event-Id': 'event-123',
            'X-Recart-Event-Type': 'order.created',
            'X-Recart-Signature-256': 'mocked-signature-123',
          }),
        })
      );

      expect(result).toEqual({
        success: true,
        statusCode: 200,
        partnerName: 'Test Partner',
        eventId: 'event-123',
        attempt: 1,
      });
    });

    it('should retry on failed attempts and succeed eventually', async () => {
      mockAxios.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(createMockResponse(200));

      const result = await webhookClient.sendWebhook(
        mockPartner,
        'order.created',
        eventData,
        'event-123'
      );

      expect(mockAxios.post).toHaveBeenCalledTimes(2);

      expect(result).toEqual({
        success: true,
        statusCode: 200,
        partnerName: 'Test Partner',
        eventId: 'event-123',
        attempt: 2,
      });
    });

    it('should return error response after max retries', async () => {
      const axiosError = new Error('Request failed') as any;
      axiosError.__AXIOS_ERROR__ = true;
      axiosError.response = {
        status: 500,
        data: 'Server Error',
      };

      mockAxios.post.mockRejectedValue(axiosError);

      const result = await webhookClient.sendWebhook(
        mockPartner,
        'order.created',
        eventData,
        'event-123'
      );

      expect(mockAxios.post).toHaveBeenCalledTimes(webhookConfig.maxAttempts);

      expect(result).toEqual({
        success: false,
        statusCode: 500,
        partnerName: 'Test Partner',
        eventId: 'event-123',
        attempt: webhookConfig.maxAttempts,
        error: expect.stringContaining('Request failed with status code 500'),
      });
    });

    it('should handle timeout errors correctly', async () => {
      const timeoutError = new Error('Timeout') as any;
      timeoutError.__AXIOS_ERROR__ = true;
      timeoutError.code = 'ETIMEDOUT';

      mockAxios.post.mockRejectedValue(timeoutError);

      const result = await webhookClient.sendWebhook(
        mockPartner,
        'order.created',
        eventData,
        'event-123'
      );

      expect(result).toEqual({
        success: false,
        statusCode: 500,
        partnerName: 'Test Partner',
        eventId: 'event-123',
        attempt: webhookConfig.maxAttempts,
        error: expect.stringContaining(`Request timed out after ${webhookConfig.requestTimeoutMs}ms`),
      });
    });

    it('should handle non-2xx status codes as errors', async () => {
      mockAxios.post.mockResolvedValue(createMockResponse(429));

      const result = await webhookClient.sendWebhook(
        mockPartner,
        'order.created',
        eventData,
        'event-123'
      );

      expect(mockAxios.post).toHaveBeenCalledTimes(webhookConfig.maxAttempts);

      expect(result).toEqual({
        success: false,
        statusCode: 429,
        partnerName: 'Test Partner',
        eventId: 'event-123',
        attempt: webhookConfig.maxAttempts,
        error: 'Failed with status code 429',
      });
    });

    it('should handle non-axios errors', async () => {
      const genericError = new Error('Something unexpected happened');

      mockAxios.post.mockRejectedValue(genericError);

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
        partnerName: 'Test Partner',
        eventId: 'event-123',
        attempt: webhookConfig.maxAttempts,
        error: 'Something unexpected happened',
      });
    });
  });
});
