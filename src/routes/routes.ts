import { Router, Request, Response } from "express";
import { BatchEventRequest } from "../types/event";
import { asyncHandler } from "../middleware/asyncHandler";
import { submitEventToQueue } from "../controllers/eventController";
import { validateBatchEventRequest } from "../middleware/validators/eventRequestValidator";
import { apiKeyAuth } from "../middleware/authMiddleware";

export const router = Router();

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
    await submitEventToQueue(req, res);
  })
)