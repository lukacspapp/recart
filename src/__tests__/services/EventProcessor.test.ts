import 'reflect-metadata';
import { Container } from 'inversify';
import mongoose from "mongoose";
import { EventJobPayload } from "../../types/event";
import { EventProcessor } from "../../services/EventProcessor";
import { WebhookDeliveryResult } from "../../types/webhookClient";
import { PopulatedSubscription } from "../../types/subscriptions";
import { ISubscriptionRepository } from '../../types/interfaces/ISubscriptionRepository';
import { IWebhookClient } from '../../types/interfaces/IWebhookClient';
import { TYPES } from '../../types/inversify';

type PartnerMock = {
  _id: mongoose.Types.ObjectId;
  name: string;
  webhookUrl?: string;
  secretKey: string;
  isActive: boolean;
};

type SubscriptionMock = {
  _id: mongoose.Types.ObjectId;
  partnerId: PartnerMock;
  eventType: string;
  isActive: boolean;
};

jest.mock('../../utils/loggerUtils', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('EventProcessor', () => {
  let container: Container;
  let eventProcessor: EventProcessor;
  let mockWebhookClient: jest.Mocked<IWebhookClient>;
  let mockSubscriptionRepository: jest.Mocked<ISubscriptionRepository>;
  let mockPayload: EventJobPayload;
  let mockSubscriptions: SubscriptionMock[];
  let mockPartners: PartnerMock[];

  beforeEach(() => {
    container = new Container();

    mockWebhookClient = {
      sendWebhook: jest.fn(),
    } as unknown as jest.Mocked<IWebhookClient>;

    mockSubscriptionRepository = {
      findActiveSubscriptions: jest.fn(),
    } as unknown as jest.Mocked<ISubscriptionRepository>;

    container.bind<IWebhookClient>(TYPES.WebhookClient).toConstantValue(mockWebhookClient);
    container.bind<ISubscriptionRepository>(TYPES.SubscriptionRepository).toConstantValue(mockSubscriptionRepository);
    container.bind<EventProcessor>(TYPES.EventProcessor).to(EventProcessor);

    eventProcessor = container.get<EventProcessor>(TYPES.EventProcessor);

    mockPayload = {
      eventId: 'event-123',
      eventType: 'order.created',
      data: {
        orderId: 'order-456',
        value: 99.99
      },
      timestamp: '2025-06-01T12:00:00Z'
    };

    mockPartners = [
      {
        _id: new mongoose.Types.ObjectId('62e0125dfb5538abcdef1234'),
        name: 'Awesome Reviews',
        webhookUrl: 'https://httpbin.org/post',
        secretKey: 'awesome-reviews-secret-123',
        isActive: true
      },
      {
        _id: new mongoose.Types.ObjectId('62e0125dfb5538abcdef1235'),
        name: 'Shopping Analytics',
        webhookUrl: 'https://postman-echo.com/post',
        secretKey: 'shopping-analytics-key-456',
        isActive: true
      },
      {
        _id: new mongoose.Types.ObjectId('62e0125dfb5538abcdef1236'),
        name: 'Inactive Partner',
        webhookUrl: 'https://httpbin.org/status/429',
        secretKey: 'inactive-partner-key-789',
        isActive: false
      },
    ];

    mockSubscriptions = [
      {
        _id: new mongoose.Types.ObjectId('62e0125dfb5538abcdef2234'),
        partnerId: mockPartners[0],
        eventType: 'order.created',
        isActive: true
      },
      {
        _id: new mongoose.Types.ObjectId('62e0125dfb5538abcdef2235'),
        partnerId: mockPartners[1],
        eventType: 'order.created',
        isActive: true
      },
    ];

    jest.clearAllMocks();
  });

  describe('processEvent', () => {
    it('should successfully process an event with active subscriptions', async () => {
      mockSubscriptionRepository.findActiveSubscriptions.mockResolvedValue(mockSubscriptions as unknown as PopulatedSubscription[]);

      mockWebhookClient.sendWebhook.mockResolvedValue({
        success: true,
        statusCode: 200,
      });

      await eventProcessor.processEvent(mockPayload);

      expect(mockSubscriptionRepository.findActiveSubscriptions)
        .toHaveBeenCalledWith(mockPayload.eventType);

      expect(mockWebhookClient.sendWebhook).toHaveBeenCalledTimes(2);
      expect(mockWebhookClient.sendWebhook).toHaveBeenCalledWith(
        mockSubscriptions[0].partnerId,
        mockPayload.eventType,
        mockPayload.data,
        mockPayload.eventId
      );
      expect(mockWebhookClient.sendWebhook).toHaveBeenCalledWith(
        mockSubscriptions[1].partnerId,
        mockPayload.eventType,
        mockPayload.data,
        mockPayload.eventId
      );
    });

    it('should log a warning when no active subscriptions found', async () => {
      mockSubscriptionRepository.findActiveSubscriptions.mockResolvedValue([]);

      await eventProcessor.processEvent(mockPayload);

      expect(mockWebhookClient.sendWebhook).not.toHaveBeenCalled();
    });

    it('should throw an error when a webhook delivery fails', async () => {
      mockSubscriptionRepository.findActiveSubscriptions.mockResolvedValue(mockSubscriptions as unknown as PopulatedSubscription[]);

      const successResult: WebhookDeliveryResult = {
        success: true,
        statusCode: 200,
      };
      const failureResult: WebhookDeliveryResult = {
        success: false,
        statusCode: 500,
        error: 'Server error'
      };

      mockWebhookClient.sendWebhook
        .mockResolvedValueOnce(successResult)
        .mockResolvedValueOnce(failureResult);

      await expect(eventProcessor.processEvent(mockPayload))
        .rejects
        .toThrow(`One or more webhook deliveries failed for event ${mockPayload.eventId}`);

      expect(mockWebhookClient.sendWebhook).toHaveBeenCalledTimes(2);
    });

    it('should skip inactive partners', async () => {
      const inactivePartnerSubscription = {
        _id: new mongoose.Types.ObjectId('62e0125dfb5538abcdef2236'),
        partnerId: mockPartners[2],
        eventType: 'order.created',
        isActive: true
      };

      const subscriptionsWithInactive = [...mockSubscriptions, inactivePartnerSubscription];

      mockSubscriptionRepository.findActiveSubscriptions.mockResolvedValue(subscriptionsWithInactive as any);

      mockWebhookClient.sendWebhook.mockResolvedValue({
        success: true,
        statusCode: 200,
      });

      await eventProcessor.processEvent(mockPayload);

      expect(mockWebhookClient.sendWebhook).toHaveBeenCalledTimes(2);
    });

    it('should skip partners without a webhookUrl', async () => {
      const partnerWithoutUrl = {
        _id: new mongoose.Types.ObjectId('62e0125dfb5538abcdef1237'),
        name: 'No URL Partner',
        secretKey: 'secret',
        isActive: true
      };

      const noUrlPartnerSubscription = {
        _id: new mongoose.Types.ObjectId('62e0125dfb5538abcdef2237'),
        partnerId: partnerWithoutUrl,
        eventType: 'order.created',
        isActive: true
      };

      const subscriptionsWithInvalid = [...mockSubscriptions, noUrlPartnerSubscription];

      mockSubscriptionRepository.findActiveSubscriptions.mockResolvedValue(subscriptionsWithInvalid as any);

      mockWebhookClient.sendWebhook.mockResolvedValue({
        success: true,
        statusCode: 200,
      });

      await eventProcessor.processEvent(mockPayload);

      expect(mockWebhookClient.sendWebhook).toHaveBeenCalledTimes(2);
    });

    it('should handle database errors when finding subscriptions', async () => {
      const dbError = new Error('Database connection failed');
      mockSubscriptionRepository.findActiveSubscriptions.mockRejectedValue(dbError);

      await expect(eventProcessor.processEvent(mockPayload))
        .rejects
        .toThrow('Database connection failed');
    });
  });
});
