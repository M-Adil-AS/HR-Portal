import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HttpClientService {
  constructor(private readonly httpService: HttpService) {
    // Service-level defaults
    const axiosInstance = this.httpService.axiosRef;

    axiosInstance.defaults.headers.common['Content-Type'] = 'application/json';
    axiosInstance.defaults.headers.common['Accept'] = 'application/json';
    axiosInstance.defaults.responseType = 'json';

    // Add request interceptor for application-specific behavior
    axiosInstance.interceptors.request.use((request) => {
      request.headers['X-Request-Time'] = new Date().toISOString();
      return request;
    });

    // Add response interceptor for application-specific behavior
    axiosInstance.interceptors.response.use(
      (response) => {
        // Do something with response data. Any status code that lie within the range of 2xx cause this function to trigger
        return response;
      },
      (error) => {
        // Do something with response error. Any status codes that falls outside the range of 2xx cause this function to trigger
        return Promise.reject(error);
      },
    );
  }

  async get(url: string, config = {}) {
    return firstValueFrom(this.httpService.get(url, config));
  }
  async post(url: string, data: any, config = {}) {
    return firstValueFrom(this.httpService.post(url, data, config));
  }
  async put(url: string, data: any, config = {}) {
    return firstValueFrom(this.httpService.put(url, data, config));
  }
  async patch(url: string, data: any, config = {}) {
    return firstValueFrom(this.httpService.patch(url, data, config));
  }
  async delete(url: string, config = {}) {
    return firstValueFrom(this.httpService.delete(url, config));
  }
  setGlobalHeader(headerName: string, headerValue: string) {
    this.httpService.axiosRef.defaults.headers.common[headerName] = headerValue;
  }
  setBearerToken(token: string) {
    this.setGlobalHeader('Authorization', `Bearer ${token}`);
  }
  clearBearerToken() {
    this.setGlobalHeader('Authorization', '');
  }
  get axiosInstance() {
    return this.httpService.axiosRef;
  }
}
