export interface TenantCredentials {
  dbName: string;
  login: string;
  encryptedPassword: string;
  salt: string;
  iv: string;
}
