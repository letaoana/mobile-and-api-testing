import type { Credentials } from '../clients/AuthClient.ts';

/** Admin credentials published in the Restful Booker documentation; override through the environment. */
export const adminCredentials: Credentials = {
  username: process.env.BOOKER_USERNAME || 'admin',
  password: process.env.BOOKER_PASSWORD || 'password123',
};
