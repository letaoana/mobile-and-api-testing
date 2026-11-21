import { envOr } from './env.ts';
import { saveFailureEvidence, sharedConfig, toFileName } from './wdio.shared.conf.ts';

/** Settings shared by every cloud device provider (Sauce Labs, BrowserStack). */
export const cloudConfig: Omit<WebdriverIO.Config, 'capabilities'> = {
  ...sharedConfig,
  // Each spec file runs on its own device, up to the account's concurrency limit.
  maxInstances: Number(envOr('CLOUD_MAX_INSTANCES', '2')),
  connectionRetryTimeout: 600_000,
  specFileRetries: 1,
  services: [],

  // Cloud providers record video and device logs for every session.
  beforeTest: undefined,
  async afterTest(test, _context, { passed }) {
    if (!passed) {
      await saveFailureEvidence(`${toFileName(test.parent)}--${toFileName(test.title)}`);
    }
  },
};

export const buildName = (provider: string, platform: 'Android' | 'iOS'): string =>
  `${envOr(
    'CLOUD_BUILD',
    `mobile-and-api-testing ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
  )} (${provider} ${platform})`;
