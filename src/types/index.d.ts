import { Partner } from './partner';

declare global {
  namespace Express {
    interface Request {
      partner?: Partner;
    }
  }
}
