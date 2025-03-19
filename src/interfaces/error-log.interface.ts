export interface ErrorLog {
  status: number;
  message: string;
  data: Record<string, any> | null; // Object with key-value pairs
  timestamp: string;
  path: string;
}
