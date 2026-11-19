import { adminCredentials } from '../data/credentials.ts';
import { expect, test } from '../fixtures/booker.fixtures.ts';
import { BadCredentialsResponseSchema, TokenResponseSchema } from '../schemas/booker.schemas.ts';

test.describe('POST /auth - create token', () => {
  test('returns a token for valid credentials', async ({ authClient }) => {
    const response = await authClient.createToken(adminCredentials);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    const { token } = TokenResponseSchema.parse(body);
    expect(token).not.toHaveLength(0);
  });

  test('returns a new token on every request', async ({ authClient }) => {
    const tokens = await Promise.all(
      [1, 2].map(async () => {
        const response = await authClient.createToken(adminCredentials);
        return TokenResponseSchema.parse(await response.json()).token;
      }),
    );

    expect(tokens[0]).not.toBe(tokens[1]);
  });

  test('does not return a token for a wrong password', async ({ authClient }) => {
    const response = await authClient.createToken({
      ...adminCredentials,
      password: 'wrong-password',
    });

    // The API reports failed logins in the body rather than with a 4xx status.
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(BadCredentialsResponseSchema.parse(body)).toEqual({ reason: 'Bad credentials' });
    expect(body).not.toHaveProperty('token');
  });
});
