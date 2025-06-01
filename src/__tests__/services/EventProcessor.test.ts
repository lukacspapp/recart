import mongoose from "mongoose";
import SubscriptionModel from "../../models/SubscriptionModel";
import { EventProcessorService } from "../../services/EventProcessor";
import { WebhookClient } from "../../services/WebhookClient";
import { EventJobPayload } from "../../types/event";
import { logger } from "../../utils/loggerUtils";

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


jest.mock('../../models/SubscriptionModel', () => ({
  find: jest.fn(),
}));

jest.mock('../../utils/loggerUtils', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('EventProcessorService', () => {
  let mockWebhookClient: jest.Mocked<WebhookClient>;
  let eventProcessorService: EventProcessorService;
  let mockSubscriptions: SubscriptionMock[];
  let mockPayload: EventJobPayload;
  let mockPartners: PartnerMock[];


  beforeEach(() => {
    mockWebhookClient = {
      sendWebhook: jest.fn(),
    } as unknown as jest.Mocked<WebhookClient>;

    eventProcessorService = new EventProcessorService(mockWebhookClient);

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
      const mockPopulate = jest.fn().mockResolvedValue(mockSubscriptions);
      (SubscriptionModel.find as jest.Mock).mockReturnValue({
        populate: mockPopulate
      });

      mockWebhookClient.sendWebhook.mockResolvedValue({
        success: true,
        statusCode: 200,
      });

      await eventProcessorService.processEvent(mockPayload);

      expect(SubscriptionModel.find).toHaveBeenCalledWith({
        eventType: 'order.created',
        isActive: true,
      });
      expect(mockPopulate).toHaveBeenCalledWith('partnerId');

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
      const mockPopulate = jest.fn().mockResolvedValue([]);
      (SubscriptionModel.find as jest.Mock).mockReturnValue({
        populate: mockPopulate
      });

      await eventProcessorService.processEvent(mockPayload);

      expect(logger.warn).toHaveBeenCalledWith(
        `No active subscriptions found for event type: ${mockPayload.eventType}`
      );

      expect(mockWebhookClient.sendWebhook).not.toHaveBeenCalled();
    });

    it('should throw an error when a webhook delivery fails', async () => {
      const mockPopulate = jest.fn().mockResolvedValue(mockSubscriptions);
      (SubscriptionModel.find as jest.Mock).mockReturnValue({
        populate: mockPopulate
      });

      mockWebhookClient.sendWebhook
        .mockResolvedValueOnce({
          success: true,
          statusCode: 200,
        })
        .mockResolvedValueOnce({
          success: false,
          statusCode: 500,
          error: 'Server error'
        });

      await expect(eventProcessorService.processEvent(mockPayload))
        .rejects
        .toThrow(`One or more webhook deliveries failed for event ${mockPayload.eventId}`);

      expect(mockWebhookClient.sendWebhook).toHaveBeenCalledTimes(2);
    });

    it('should skip inactive partners', async () => {
      const inactivePartnerSubscription = {
        partnerId: {
          _id: 'partner-3',
          name: 'Inactive Partner',
          webhookUrl: 'https://example.com',
          secretKey: 'secret',
          isActive: false
        },
        eventType: 'order.created',
        isActive: true,
        _id: 'sub-3'
      };

      const subscriptionsWithInactive = [...mockSubscriptions, inactivePartnerSubscription];

      const mockPopulate = jest.fn().mockResolvedValue(subscriptionsWithInactive);
      (SubscriptionModel.find as jest.Mock).mockReturnValue({
        populate: mockPopulate
      });

      mockWebhookClient.sendWebhook.mockResolvedValue({
        success: true,
        statusCode: 200,
      });

      await eventProcessorService.processEvent(mockPayload);

      expect(mockWebhookClient.sendWebhook).toHaveBeenCalledTimes(2);
    });

    it('should skip partners without a webhookUrl', async () => {
      const noUrlPartnerSubscription = {
        partnerId: {
          _id: 'partner-4',
          name: 'No URL Partner',
          secretKey: 'secret',
          isActive: true
        },
        eventType: 'order.created',
        isActive: true,
        _id: 'sub-4'
      };

      const subscriptionsWithInvalid = [...mockSubscriptions, noUrlPartnerSubscription];

      const mockPopulate = jest.fn().mockResolvedValue(subscriptionsWithInvalid);
      (SubscriptionModel.find as jest.Mock).mockReturnValue({
        populate: mockPopulate
      });

      mockWebhookClient.sendWebhook.mockResolvedValue({
        success: true,
        statusCode: 200,
      });

      await eventProcessorService.processEvent(mockPayload);

      expect(mockWebhookClient.sendWebhook).toHaveBeenCalledTimes(2);
    });

    it('should handle database errors when finding subscriptions', async () => {
      const dbError = new Error('Database connection failed');
      (SubscriptionModel.find as jest.Mock).mockImplementation(() => {
        throw dbError;
      });

      await expect(eventProcessorService.processEvent(mockPayload))
        .rejects
        .toThrow(/Database error fetching subscriptions/);
    });
  });
});
