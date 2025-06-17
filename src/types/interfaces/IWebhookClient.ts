import { EventPayloadData } from "../event";
import { Partner } from "../partner";
import { WebhookDeliveryResult } from "../webhookClient";


export interface IWebhookClient {
  sendWebhook(
    partner: Partner,
    eventType: string,
    data: EventPayloadData,
    eventId: string
  ): Promise<WebhookDeliveryResult>;
}