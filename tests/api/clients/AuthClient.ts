import type { APIRequestContext, APIResponse } from '@playwright/test';

export interface Credentials {
  username: string;
  password: string;
}

export class AuthClient {
  constructor(private readonly request: APIRequestContext) {}

  createToken(credentials: Credentials): Promise<APIResponse> {
    return this.request.post('/auth', { data: credentials });
  }
}
