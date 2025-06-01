import { Type } from "@sinclair/typebox";
import { nonEmptyString } from "./UtilsSchema";
import { BATCH_SIZE } from "../configs/appConfig";

const EventRequestSchema = Type.Object({
  eventType: nonEmptyString,
  data: Type.Object({
    orderId: nonEmptyString,
    value: Type.Number(),
  }),
});

export const EventBatchRequestSchema = Type.Array(EventRequestSchema, {
  minItems: 1,
  maxItems: BATCH_SIZE
});