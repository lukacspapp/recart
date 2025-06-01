import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/loggerUtils';


export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error(`Error processing request to ${req.path}:`, err);

  if (res.headersSent) {
    next(err);
  }

  res.status(500).send('Internal Server Error');
};
