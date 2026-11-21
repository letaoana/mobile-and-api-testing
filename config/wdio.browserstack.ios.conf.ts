import { env, envOr } from './env.ts';
import { bstackOptions, browserStackConfig } from './wdio.browserstack.shared.conf.ts';

// BrowserStack runs iOS on real devices only, which need a signed .ipa of the demo app.
const app = env('BROWSERSTACK_IOS_APP');
if (!app) {
  throw new Error(
    'BrowserStack iOS needs a signed .ipa: run "npm run browserstack:upload -- <path to .ipa>" ' +
      'and set BROWSERSTACK_IOS_APP to the printed app id.',
  );
}

export const config: WebdriverIO.Config = {
  ...browserStackConfig,
  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:app': app,
      'appium:noReset': false,
      'appium:newCommandTimeout': 240,
      'bstack:options': {
        ...bstackOptions('iOS'),
        deviceName: envOr('BROWSERSTACK_IOS_DEVICE', 'iPhone 15'),
        platformVersion: envOr('BROWSERSTACK_IOS_VERSION', '17'),
      },
    },
  ],
};
