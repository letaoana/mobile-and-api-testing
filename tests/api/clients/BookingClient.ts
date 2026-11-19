import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Booking } from '../schemas/booker.schemas.ts';

/** Thin wrapper around the `/booking` endpoints. */
export class BookingClient {
  constructor(private readonly request: APIRequestContext) {}

  create(booking: Booking): Promise<APIResponse> {
    return this.request.post('/booking', { data: booking });
  }

  get(bookingId: number): Promise<APIResponse> {
    return this.request.get(`/booking/${bookingId}`);
  }

  delete(bookingId: number, token: string): Promise<APIResponse> {
    return this.request.delete(`/booking/${bookingId}`, {
      headers: { Cookie: `token=${token}` },
    });
  }
}
