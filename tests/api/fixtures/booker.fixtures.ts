import { test as base } from '@playwright/test';
import { AuthClient } from '../clients/AuthClient.ts';
import { BookingClient } from '../clients/BookingClient.ts';
import { adminCredentials } from '../data/credentials.ts';
import { TokenResponseSchema } from '../schemas/booker.schemas.ts';

interface BookerFixtures {
  authClient: AuthClient;
  bookingClient: BookingClient;
  /** Registers a booking id to be deleted once the test finishes. */
  cleanUpBooking: (bookingId: number) => void;
}

export const test = base.extend<BookerFixtures>({
  authClient: async ({ request }, use) => {
    await use(new AuthClient(request));
  },

  bookingClient: async ({ request }, use) => {
    await use(new BookingClient(request));
  },

  cleanUpBooking: async ({ authClient, bookingClient }, use) => {
    const bookingIds: number[] = [];
    await use((bookingId) => bookingIds.push(bookingId));

    if (bookingIds.length === 0) {
      return;
    }
    const authResponse = await authClient.createToken(adminCredentials);
    const { token } = TokenResponseSchema.parse(await authResponse.json());
    for (const bookingId of bookingIds) {
      const response = await bookingClient.delete(bookingId, token);
      if (response.status() !== 201) {
        console.warn(`Clean-up of booking ${bookingId} failed with HTTP ${response.status()}`);
      }
    }
  },
});

export { expect } from '@playwright/test';
