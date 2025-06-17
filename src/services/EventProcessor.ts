import { injectable, inject } from 'inversify';
import { EventJobPayload, EventPayloadData } from '../types/event';
import { logger } from '../utils/loggerUtils';
import { Partner } from '../types/partner';
import { PopulatedSubscription } from '../types/subscriptions';
import { IEventProcessor } from '../types/interfaces/IEventProcessor';
import { IWebhookClient } from '../types/interfaces/IWebhookClient';
import { ISubscriptionRepository } from '../types/interfaces/ISubscriptionRepository';
import { TYPES } from '../types/inversify';

@injectable()
export class EventProcessor implements IEventProcessor {
  constructor(
    @inject(TYPES.WebhookClient) private readonly webhookClient: IWebhookClient,
    @inject(TYPES.SubscriptionRepository) private readonly subscriptionRepository: ISubscriptionRepository
  ) { }

  public async processEvent(jobPayload: EventJobPayload): Promise<void> {
    const { eventId, eventType, data } = jobPayload;

    const subscriptions = await this.subscriptionRepository.findActiveSubscriptions(eventType);

    if (!subscriptions.length) {
      logger.warn(`No active subscriptions found for event type: ${eventType}`);
      return;
    }

    await this.notifySubscribers(subscriptions, eventType, data, eventId);
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

        const result = await this.webhookClient.sendWebhook(partnerId, eventType, data, eventId);

        if (!result.success) {
          allPartnerDeliveriesSuccessfulOrNonCritical = false;
          if (!firstCriticalFailureMessage) {
            firstCriticalFailureMessage = `Delivery to partner ${partnerId.name} failed: ${result.error || `Status ${result.statusCode}`}`;
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
