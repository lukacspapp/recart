import { Request, Response, NextFunction } from 'express';
import Partner from '../models/PartnerModels';
import { logger } from '../utils/loggerUtils';

export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apiKey = req.header('X-API-Key');

    if (!apiKey) {
      res.status(401).json({ error: 'API key is required' });
      return;
    }

    const partner = await Partner.findOne({ secretKey: apiKey, isActive: true });

    if (!partner) {
      res.status(401).json({ error: 'Invalid API key or inactive partner' });
      return;
    }

    req.partner = partner;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};
