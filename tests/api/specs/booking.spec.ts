import { buildBooking } from '../data/bookingFactory.ts';
import { expect, test } from '../fixtures/booker.fixtures.ts';
import { BookingSchema, CreateBookingResponseSchema } from '../schemas/booker.schemas.ts';

test.describe('POST /booking - create booking', () => {
  test('creates a booking and returns the data that was sent', async ({
    bookingClient,
    cleanUpBooking,
  }) => {
    const booking = buildBooking();

    const response = await bookingClient.create(booking);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = CreateBookingResponseSchema.parse(await response.json());
    cleanUpBooking(body.bookingid);

    expect(body.bookingid).toBeGreaterThan(0);
    expect(body.booking).toEqual(booking);
  });

  test('persists the booking so it can be read back by id', async ({
    bookingClient,
    cleanUpBooking,
  }) => {
    const booking = buildBooking({ depositpaid: false, additionalneeds: 'Late check-out' });

    const created = CreateBookingResponseSchema.parse(
      await (await bookingClient.create(booking)).json(),
    );
    cleanUpBooking(created.bookingid);

    const response = await bookingClient.get(created.bookingid);

    expect(response.status()).toBe(200);
    expect(BookingSchema.parse(await response.json())).toEqual(booking);
  });

  test('creates a booking without the optional additional needs', async ({
    bookingClient,
    cleanUpBooking,
  }) => {
    const { additionalneeds: _omitted, ...booking } = buildBooking();

    const response = await bookingClient.create(booking);

    expect(response.status()).toBe(200);
    const body = CreateBookingResponseSchema.parse(await response.json());
    cleanUpBooking(body.bookingid);
    expect(body.booking).toEqual(booking);
  });
});
