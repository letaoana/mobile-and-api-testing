import { env, envOr } from './env.ts';
import { sauceConfig, sauceOptions } from './wdio.sauce.shared.conf.ts';

/**
 * Android on Sauce Labs real devices. `appium:deviceName` accepts a regular expression,
 * so any available device that matches is allocated (default: any Android device).
 * SAUCE_ANDROID_VERSION pins the Android version; leave it empty for any version.
 */
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
