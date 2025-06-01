const getTimestamp = (): string => new Date().toISOString();

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${getTimestamp()} - ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${getTimestamp()} - ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${getTimestamp()} - ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${getTimestamp()} - ${message}`, ...args);
    }
  },
};
