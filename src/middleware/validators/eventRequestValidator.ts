import { NextFunction, Request, Response } from 'express';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { EventBatchRequestSchema } from "../../schema/EventRequestSchema";
import { getValidatorErrors } from './validationUtils';

const batchEventRequestValidator = TypeCompiler.Compile(EventBatchRequestSchema)

export const validateBatchEventRequest = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { body } = req;

    if (!body || typeof body !== 'object') {
      res.status(400).send('Invalid request body.');
      return;
    }

    if (!batchEventRequestValidator.Check(body)) {
      const errors = getValidatorErrors(body, EventBatchRequestSchema);
      res.status(400).send(`Invalid request body. Errors: ${errors.map((error) => `${error.path}: ${error.message}`).join(', ')}`);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}