import express from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/loggerUtils';
import { connectToMongoDb } from './utils/mongoUtils';
import { router } from './routes/routes';
import { APP_PORT } from './configs/appConfig';
import { errorHandler } from './middleware/errorHandler';
import './models/PartnerModels';
import './models/SubscriptionModel';

dotenv.config();

async function app(): Promise<void> {
  await connectToMongoDb();

  const app = express();
  app.use(express.json());

  app.use(router);
  app.use(errorHandler);


  app.listen(APP_PORT, () => {
    logger.info(`API server listening on port ${APP_PORT}`);
  });
}

app().catch((err) => {
  logger.error('Failed to initialize application:', err);
  process.exit(1);
});
