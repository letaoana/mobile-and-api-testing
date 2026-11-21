import { randomUUID } from 'node:crypto';
import type { Credentials } from '../screens/LoginScreen.ts';

const VALID_PASSWORD = 'Str0ngPassw0rd!';

export function newUser(): Credentials {
  return {
    email: `qa.${randomUUID().slice(0, 8)}@example.com`,
    password: VALID_PASSWORD,
  };
}

// The app has no backend; the only password it rejects is one under 8 characters.
export const WRONG_PASSWORD = 'short';
