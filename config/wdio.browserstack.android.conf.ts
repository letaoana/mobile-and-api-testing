import { envOr } from './env.ts';
import { appId, bstackOptions, browserStackConfig } from './wdio.browserstack.shared.conf.ts';

export const config: WebdriverIO.Config = {
  ...browserStackConfig,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:app': envOr('BROWSERSTACK_ANDROID_APP', appId('android')),
      'appium:autoGrantPermissions': true,
      'appium:noReset': false,
      'appium:newCommandTimeout': 240,
      'bstack:options': {
        ...bstackOptions('Android'),
        deviceName: envOr('BROWSERSTACK_ANDROID_DEVICE', 'Google Pixel 8'),
        platformVersion: envOr('BROWSERSTACK_ANDROID_VERSION', '14.0'),
      },
    },
  ],
};
