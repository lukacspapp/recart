import { PopulatedSubscription } from "../subscriptions";

export interface ISubscriptionRepository {
  findActiveSubscriptions(eventType: string): Promise<PopulatedSubscription[]>;
}
