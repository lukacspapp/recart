import { Schema, model } from 'mongoose';
import { Subscription } from '../types/subscriptions';

const SubscriptionSchema = new Schema<Subscription>(
  {
    partnerId: { type: Schema.Types.ObjectId, ref: 'Partner', required: true },
    eventType: { type: String, required: true, trim: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ partnerId: 1, eventType: 1 });

export default model<Subscription>('Subscription', SubscriptionSchema);
