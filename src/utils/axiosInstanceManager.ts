import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from './loggerUtils';

export class AxiosInstanceManager {
  private axiosInstance: AxiosInstance;

  constructor(timeout: number) {
    this.axiosInstance = axios.create({
      timeout
    });

    this.setupInterceptors();
  }

  public getInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            logger.error(`HTTP error ${error.response.status}: ${error.message}`);
          } else {
            logger.error(`Network error: ${error.message}`);
          }
        } else {
          logger.error('Unknown error:', error);
        }
        return Promise.reject(error);
      }
    );
  }
}
