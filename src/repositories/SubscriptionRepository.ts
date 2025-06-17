import { injectable } from 'inversify';
import SubscriptionModel from '../models/SubscriptionModel';
import { PopulatedSubscription } from '../types/subscriptions';
import { Partner } from '../types/partner';
import { ISubscriptionRepository } from '../types/interfaces/ISubscriptionRepository';

@injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
  public async findActiveSubscriptions(eventType: string): Promise<PopulatedSubscription[]> {
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
}
