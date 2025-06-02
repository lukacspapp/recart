import { Schema, model } from 'mongoose';
import { Partner } from '../types/partner';

const PartnerSchema = new Schema<Partner>(
  {
    name: { type: String, required: true, trim: true, index: true },
    webhookUrl: { type: String, required: true, trim: true },
    apiKey: { type: String, required: true, unique: true },
    secretKey: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<Partner>('Partner', PartnerSchema);
