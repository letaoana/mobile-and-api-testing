import { randomInt, randomUUID } from 'node:crypto';
import type { Booking } from '../schemas/booker.schemas.ts';

/** Formats a date as YYYY-MM-DD, the format the API stores. */
const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

const daysFromToday = (days: number): Date => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

/**
 * Builds a valid booking with unique names so the record created by a test can
 * be told apart from the thousands of bookings on the shared public API.
 */
export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  const checkInOffset = randomInt(1, 60);
  const suffix = randomUUID().slice(0, 8);

  return {
    firstname: `Thabo-${suffix}`,
    lastname: 'Mokoena',
    totalprice: randomInt(50, 5_000),
    depositpaid: true,
    bookingdates: {
      checkin: toIsoDate(daysFromToday(checkInOffset)),
      checkout: toIsoDate(daysFromToday(checkInOffset + randomInt(1, 14))),
    },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
