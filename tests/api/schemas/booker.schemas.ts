import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected a YYYY-MM-DD date');

export const BookingSchema = z.strictObject({
  firstname: z.string(),
  lastname: z.string(),
  totalprice: z.number().int().nonnegative(),
  depositpaid: z.boolean(),
  bookingdates: z.strictObject({
    checkin: isoDate,
    checkout: isoDate,
  }),
  additionalneeds: z.string().optional(),
});

export const CreateBookingResponseSchema = z.strictObject({
  bookingid: z.number().int().positive(),
  booking: BookingSchema,
});

export const TokenResponseSchema = z.strictObject({
  token: z
    .string()
    .regex(/^[a-z0-9]+$/i, 'expected an alphanumeric token')
    .min(10),
});

/** Restful Booker answers failed logins with HTTP 200 and a reason instead of a 401. */
export const BadCredentialsResponseSchema = z.strictObject({
  reason: z.literal('Bad credentials'),
});

export type Booking = z.infer<typeof BookingSchema>;
export type CreateBookingResponse = z.infer<typeof CreateBookingResponseSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
