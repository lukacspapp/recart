import { ObjectId } from "mongoose";
import { Partner } from "./partner";

export interface PopulatedSubscription extends Omit<Subscription, 'partnerId'> {
  partnerId: Partner | null;
}

export interface Subscription extends Document {
  _id: ObjectId;
  partnerId: ObjectId | Partner;
  eventType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

