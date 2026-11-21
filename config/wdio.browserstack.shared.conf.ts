import { basename } from 'node:path';
import { env, envOr } from './env.ts';
import { buildName, cloudConfig } from './wdio.cloud.shared.conf.ts';

const user = env('BROWSERSTACK_USERNAME');
const key = env('BROWSERSTACK_ACCESS_KEY');
if (!user || !key) {
  throw new Error(
    'BrowserStack credentials missing: set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY.',
  );
}

/** Custom id the app is uploaded under (scripts/browserstack-upload-app.mjs uses the same id). */
export const appId = (platform: 'android' | 'ios'): string =>
  `wdio-native-demo-${platform}-${envOr('APP_VERSION', 'v2.2.0')}`;

export const bstackOptions = (platform: 'Android' | 'iOS') => ({
  projectName: 'mobile-and-api-testing',
  buildName: buildName('BrowserStack', platform),
  idleTimeout: 180,
});

const executor = (action: string, args: Record<string, unknown>) =>
  driver.execute(`browserstack_executor: ${JSON.stringify({ action, arguments: args })}`);

export const browserStackConfig: Omit<WebdriverIO.Config, 'capabilities'> = {
  ...cloudConfig,
  user,
  key,
  hostname: 'hub.browserstack.com',
  protocol: 'https',
  port: 443,
  path: '/wd/hub',

  // BrowserStack has no WebdriverIO 10 service, so name the session and report its
  // result through BrowserStack's executor commands.
  async before(_capabilities, specs) {
    const name = basename(specs[0] ?? 'mobile tests');
    await executor('setSessionName', { name }).catch(() => undefined);
  },
  async after(result) {
    await executor('setSessionStatus', {
      status: result === 0 ? 'passed' : 'failed',
      reason: result === 0 ? '' : 'Tests failed',
    }).catch(() => undefined);
  },
};
