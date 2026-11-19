import { randomUUID } from 'node:crypto';
import type { Credentials } from '../screens/LoginScreen.ts';

/** Password that satisfies the app's rule of at least 8 characters. */
const VALID_PASSWORD = 'Str0ngPassw0rd!';

/** Builds a unique, valid user so every run signs up a brand-new account. */
export function newUser(): Credentials {
  return {
    email: `qa.${randomUUID().slice(0, 8)}@example.com`,
    password: VALID_PASSWORD,
  };
}

/**
 * The demo app has no backend: it validates credentials client side only.
 * A password shorter than 8 characters is the "wrong password" the app rejects.
 */
export const WRONG_PASSWORD = 'short';
