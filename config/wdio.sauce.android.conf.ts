import { env, envOr } from './env.ts';
import { sauceConfig, sauceOptions } from './wdio.sauce.shared.conf.ts';

// deviceName is a regular expression: any available real device that matches is allocated.
const platformVersion = env('SAUCE_ANDROID_VERSION');

export const config: WebdriverIO.Config = {
  ...sauceConfig,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': envOr('SAUCE_ANDROID_DEVICE', '.*'),
      ...(platformVersion && { 'appium:platformVersion': platformVersion }),
      'appium:app': `storage:filename=${envOr('SAUCE_ANDROID_APP', 'android.wdio.native.app.apk')}`,
      'appium:autoGrantPermissions': true,
      'appium:noReset': false,
      'appium:newCommandTimeout': 240,
      'sauce:options': sauceOptions('Android'),
    },
  ],
};
