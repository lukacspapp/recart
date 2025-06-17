import { injectable, inject } from 'inversify';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { IHttpClient } from '../types/interfaces/IHttpClient';
import { TYPES } from '../types/inversify';
import { AxiosInstanceManager } from '../utils/axiosInstanceManager';
import { HeaderMetaData } from '../types/webhookClient';

@injectable()
export class HttpClient implements IHttpClient {
  constructor(
    @inject(TYPES.AxiosInstanceManager) private readonly axiosManager: AxiosInstanceManager
  ) { }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosManager.getInstance().post(url, data, config);
  }

  createRequestWithWebhookHeaders<T = any>(
    url: string,
    data: any,
    metadata: HeaderMetaData,
    timeout?: number
  ): Promise<AxiosResponse<T>> {
    return this.axiosManager.post<T>(url, data, {
      webhookMetadata: metadata,
      timeout
    });
  }
}
