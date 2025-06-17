import * as bcrypt from 'bcrypt';

export const compareApiKey = async (plainApiKey: string, hashedApiKey: string): Promise<boolean> => {
  if (!plainApiKey || !hashedApiKey) {
    return false;
  }
  return bcrypt.compare(plainApiKey, hashedApiKey);
}