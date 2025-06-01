import { Static } from "@sinclair/typebox";
import { Request } from "express";
import { EventBatchRequestSchema } from "../schema/EventRequestSchema";

export type EventBatch = Static<typeof EventBatchRequestSchema>;

export interface EventRequestData {
  orderId: string;
  value: number;
}

export interface EventPayloadData {
  orderId: string;
  value: number;
}

export interface EventJobPayload {
  eventId: string;
  eventType: string;
  data: EventPayloadData;
  timestamp: string;
}

export interface SuccessfulEventResponse {
  message: string;
  events: string[];
}


export type BatchEventRequest = Request & { body: EventBatch }