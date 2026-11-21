import type { Options } from '@wdio/types';
import { env, envOr } from './env.ts';
import { buildName, cloudConfig } from './wdio.cloud.shared.conf.ts';

const user = env('SAUCE_LABS_USERNAME') ?? env('SAUCE_USERNAME');
const key = env('SAUCE_LABS_ACCESS_KEY') ?? env('SAUCE_ACCESS_KEY');
if (!user || !key) {
  throw new Error(
    'Sauce Labs credentials missing: set SAUCE_LABS_USERNAME and SAUCE_LABS_ACCESS_KEY.',
  );
}

export const sauceOptions = (platform: 'Android' | 'iOS') => ({
  build: buildName('Sauce Labs', platform),
  appiumVersion: envOr('SAUCE_APPIUM_VERSION', 'latest'),
  idleTimeout: 180,
});

export const sauceConfig: Omit<WebdriverIO.Config, 'capabilities'> = {
  ...cloudConfig,
  user,
  key,
  region: envOr('SAUCE_REGION', 'eu-central-1') as Options.SauceRegions,
  // Reports each job's name and pass/fail status to the Sauce Labs dashboard.
  services: ['sauce'],
};
