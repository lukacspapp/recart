
import 'reflect-metadata';
import { Container } from 'inversify';
import { Queue } from 'bullmq';
import { webhookQueue } from '../utils/bullMqUtils';
import { WEBHOOK_CONFIG } from '../configs/webhookConfig';
import { WebhookClient } from '../services/WebhookClient';
import { TYPES } from '../types/inversify';
import { EventController } from '../controllers/eventController';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { BatchProcessor } from '../services/BatchProcessing';
import { EventProcessor } from '../services/EventProcessor';
import { HttpClient } from '../services/HttpClient';
import { IBatchProcessor } from '../types/interfaces/IBatchProcessor';
import { IEventProcessor } from '../types/interfaces/IEventProcessor';
import { IHttpClient } from '../types/interfaces/IHttpClient';
import { IWebhookClient } from '../types/interfaces/IWebhookClient';
import { ISubscriptionRepository } from '../types/interfaces/ISubscriptionRepository';

const container = new Container();

container.bind(TYPES.WebhookConfig).toConstantValue(WEBHOOK_CONFIG);

container.bind<Queue>(TYPES.WebhookQueue).toConstantValue(webhookQueue);

container.bind<IHttpClient>(TYPES.HttpClient).to(HttpClient).inSingletonScope();
container.bind<IWebhookClient>(TYPES.WebhookClient).to(WebhookClient).inSingletonScope();
container.bind<IEventProcessor>(TYPES.EventProcessor).to(EventProcessor).inSingletonScope();
container.bind<IBatchProcessor>(TYPES.BatchProcessor).to(BatchProcessor).inSingletonScope();

container.bind<ISubscriptionRepository>(TYPES.SubscriptionRepository).to(SubscriptionRepository).inSingletonScope();

container.bind<EventController>(TYPES.EventController).to(EventController).inSingletonScope();

export { container };
