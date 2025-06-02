import { Document, ObjectId } from 'mongoose';

export interface Partner extends Document {
  _id: ObjectId;
  name: string;
  webhookUrl: string;
  secretKey: string;
  apiKey: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}