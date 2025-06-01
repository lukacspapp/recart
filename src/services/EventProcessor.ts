import SubscriptionModel from '../models/SubscriptionModel';
import { EventJobPayload, EventPayloadData } from '../types/event';
import { WebhookClient } from './WebhookClient';
import { logger } from '../utils/loggerUtils';
import { Partner } from '../types/partner';
import { PopulatedSubscription } from '../types/subscriptions';

export class EventProcessorService {
  private webhookClient: WebhookClient;

  constructor(webhookClient: WebhookClient) {
    this.webhookClient = webhookClient;
  }

  public async processEvent(jobPayload: EventJobPayload): Promise<void> {
    const { eventId, eventType, data } = jobPayload;

    const subscriptions = await this.findActiveSubscriptions(eventType);

    if (!subscriptions.length) {
      logger.warn(`No active subscriptions found for event type: ${eventType}`);
      return;
    }

    await this.notifySubscribers(subscriptions, eventType, data, eventId);
  }

  private async findActiveSubscriptions(eventType: string): Promise<PopulatedSubscription[]> {
    try {
      const existingSubscriptions = await SubscriptionModel.find({
        eventType: eventType,
        isActive: true,
      }).populate<{ partnerId: Partner | null }>('partnerId');

      return existingSubscriptions;
    } catch (error) {
      throw new Error(`Database error fetching subscriptions: ${JSON.stringify(error)}`);
    }
  }

  private async notifySubscribers(
    subscriptions: PopulatedSubscription[],
    eventType: string,
    data: EventPayloadData,
    eventId: string
  ): Promise<void> {
    let allPartnerDeliveriesSuccessfulOrNonCritical = true;
    let firstCriticalFailureMessage: string | null = null;

    for (const { partnerId } of subscriptions) {
      if (partnerId && typeof partnerId === 'object' && '_id' in partnerId) {

        if (!this.isPartnerEligibleForNotification(partnerId)) {
          continue;
        }

        const {
          success,
          statusCode,
          error
        } = await this.webhookClient.sendWebhook(partnerId, eventType, data, eventId);

        if (!success) {
          allPartnerDeliveriesSuccessfulOrNonCritical = false;
          if (!firstCriticalFailureMessage) {
            firstCriticalFailureMessage = `Delivery to partner ${partnerId.name} failed: ${error || `Status ${statusCode}`}`;
          }
        }
      }
    }

    if (!allPartnerDeliveriesSuccessfulOrNonCritical && firstCriticalFailureMessage) {
      throw new Error(`One or more webhook deliveries failed for event ${eventId}. First critical failure: ${firstCriticalFailureMessage}`);
    }
  }

  private isPartnerEligibleForNotification(partner: Partner): boolean {
    if (!partner.isActive || !partner.webhookUrl) {
      return false;
    }

    return true;
  }
}
