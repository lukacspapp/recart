import { Router, Request, Response } from "express";
import { BatchEventRequest } from "../types/event";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateBatchEventRequest } from "../middleware/validators/eventRequestValidator";
import { apiKeyAuth } from "../middleware/authMiddleware";
import { container } from "../di/container";
import { EventController } from "../controllers/eventController";
import { TYPES } from "../types/inversify";

export const router = Router();

const eventController = container.get<EventController>(TYPES.EventController);

router.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).send('I am alive and healthy!');
  })
);

router.post(
  '/api/v1/events',
  apiKeyAuth,
  validateBatchEventRequest,
  asyncHandler<BatchEventRequest>(async (req, res) => {
    await eventController.submitEventToQueue(req, res);
  })
);
