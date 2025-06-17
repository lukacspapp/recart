import { AxiosResponse, AxiosRequestConfig } from 'axios';
import { HeaderMetaData } from '../webhookClient';

export interface IHttpClient {
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;

  createRequestWithWebhookHeaders<T = any>(
    url: string,
    data: any,
    metadata: HeaderMetaData,
    timeout?: number
  ): Promise<AxiosResponse<T>>;
}
