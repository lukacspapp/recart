export const APP_PORT = process.env.PORT || 3000;

export const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100', 10);

export const SHUTDOWN_TIMEOUT_MS = parseInt(process.env.SHUTDOWN_TIMEOUT_MS || '30000', 10);