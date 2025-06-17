import { EventJobPayload } from "../event";


export interface IEventProcessor {
  processEvent(jobPayload: EventJobPayload): Promise<void>;
}
