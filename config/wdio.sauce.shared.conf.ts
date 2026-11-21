import type { Options } from '@wdio/types';
import { env, envOr } from './env.ts';
import { saveFailureEvidence, sharedConfig, toFileName } from './wdio.shared.conf.ts';

/**
 * Sauce Labs settings shared by the Android and iOS cloud configs. The same specs and
 * screen objects run unchanged; only the server, credentials and capabilities differ.
 *
 * Credentials: SAUCE_LABS_USERNAME / SAUCE_LABS_ACCESS_KEY (the standard
 * SAUCE_USERNAME / SAUCE_ACCESS_KEY names are accepted as well).
 */
const user = env('SAUCE_LABS_USERNAME') ?? env('SAUCE_USERNAME');
const key = env('SAUCE_LABS_ACCESS_KEY') ?? env('SAUCE_ACCESS_KEY');
if (!user || !key) {
  throw new Error(
    'Sauce Labs credentials missing: set SAUCE_LABS_USERNAME and SAUCE_LABS_ACCESS_KEY.',
  );
}

export const SAUCE_REGION = envOr('SAUCE_REGION', 'eu-central-1') as Options.SauceRegions;

/** Groups the runs of one execution under a single build in the Sauce Labs dashboard. */
export const SAUCE_BUILD = envOr(
  'SAUCE_BUILD',
  `mobile-and-api-testing ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
);

/** Common `sauce:options` for every capability. */
export const sauceOptions = (platform: 'Android' | 'iOS') => ({
  build: `${SAUCE_BUILD} (${platform})`,
  appiumVersion: 'latest',
  // Keep the Sauce job alive while a slow device boots the app.
  idleTimeout: 180,
});

export const sauceConfig: Omit<WebdriverIO.Config, 'capabilities'> = {
  ...sharedConfig,
  user,
  key,
  region: SAUCE_REGION,
  // Every spec file gets its own device, so specs run in parallel up to the account's limit.
  maxInstances: Number(envOr('SAUCE_MAX_INSTANCES', '2')),
  connectionRetryTimeout: 600_000,
  // Real devices can take a while to become available; retry a spec once on infrastructure noise.
  specFileRetries: 1,
  // Reports each job's pass/fail status and name to the Sauce Labs dashboard.
  services: ['sauce'],

  // Sauce Labs records video and logs for every job, so no local recording is needed.
  beforeTest: undefined,
  async afterTest(test, _context, { passed }) {
    if (!passed) {
      await saveFailureEvidence(`${toFileName(test.parent)}--${toFileName(test.title)}`);
    }
  },
};
