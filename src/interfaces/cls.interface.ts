import { ClsStore } from 'nestjs-cls';

export interface MyClsStore extends ClsStore {
  req_url: string;
  req_body: Record<string, any> | null;
}
