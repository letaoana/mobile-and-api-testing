import type { APIRequestContext, APIResponse } from '@playwright/test';

export interface Credentials {
  username: string;
  password: string;
}

/** Thin wrapper around the `/auth` endpoint. */
export class AuthClient {
  constructor(private readonly request: APIRequestContext) {}

  createToken(credentials: Credentials): Promise<APIResponse> {
    return this.request.post('/auth', { data: credentials });
  }
}
