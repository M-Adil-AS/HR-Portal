import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

/*
  Instead of modifying service-level defaults (e.g. global headers, responseType) for every request:
  - Set default values once so that most requests use them.
  - Use per-request overrides for exceptional cases where different values are needed.
  - Avoid unnecessary modifications to defaults to prevent unintended side effects.

  If a few groups of related requests require different defaults (e.g. different headers or responseType):
  - Consider creating separate services within the http-client module, each with its own defaults.

  If every request requires different values (e.g. different headers or responseType):
  - Do not set service defaults, instead pass per-request values for all requests
  
  With request-scoping: 
  - Defaults set via setGlobalHeader() or setBearerToken() would not persist across requests
  - Modifying defaults would lead to concurrency issues / race conditions 
  - Performance overhead, unnecessary complexity
  - If request-specific data (i.e. tenantId attached to req object in middleware/interceptor) is required to be sent to Third API call, retrieve those properties in the callingService using @Req and call httpService with explicit per-request config options
  - Hence avoid using request-scoped httpService
  
  If we are making Third Party API calls on behalf of Tenants:
    1. There is only one Client ID and Client Secret stored in env
    2. Fetch Auth Token using Client ID and Client Secret
    3. There is only one Auth Token that can be stored as global header of a specific httpClientService
    4. However, if Third party API supports 'X-Tenant-Id' header option, it can be used to track Third party API usage per tenant using one Auth Token:
       headers: {
          Authorization: Bearer ${authToken},
          'X-Tenant-Id': tenantId, // Identify the tenant in your system
       },

  If each tenant must subscribe to the third party API, receive its own Client ID and Client Secret, and requires a unique auth token:
    Manual Onboarding on Third Party API
       1. The tenant registers with the third-party provider manually
       2. Gains Client ID and Client Secret
       3. Enters the Client ID and Client Secret during registration on our system or updating the API Credentials settings later after registration
       4. Client ID and Client Secret against the Tenant ID are stored in KeyVault / DB
       
    Automatic Onboarding on Third Party API
       1. If Third Party API supports automatic onboarding to it, your system can register the tenant automatically during tenant registration
       2. Once registered, store the clientId and clientSecret in your database or secrets manager against tenantId

    Auth Tokens: 
       1. Client ID and Client Secret are retrieved using @Req: tenandId assuming that it is set on the req object in middleware/interceptor
       2. Pass the Client ID and Client Secret through httpService request explicitly to gain auth Token
       3. After fetching auth Token, you can save it in with its expiry in Redis / DB / KeyVault / Map against TenantId
       4. Should have a method that checks that if expiry is reached, then regain the new auth Token before every request
       5. If expiry is not reached, use the stored / cached auth token for Third party API requests

    Recommended place to store entries of Client ID, Client Secret (encrypted) against Tenant Id is in Database
    
    Recommended place to store entries of Short Lived Auth Token against Tenant Id is in Redis 

    Recommended place to store entries of Long Lived Auth Token against Tenant Id is in Redis and then DB (Optional Backup in case Redis resets)

  Whenever we use a Third Party API, pass the auth Token explicitly in httpService per request-basis
*/

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
