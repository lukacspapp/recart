import crypto from 'crypto';

export function generateUniqueId(prefix: string = 'event_'): string {
  return prefix + crypto.randomBytes(12).toString('hex');
}

export function generateSignature(payloadString: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
}