import { envFlag, envOr } from './env.ts';
import { sauceConfig, sauceOptions } from './wdio.sauce.shared.conf.ts';

/**
 * iOS on Sauce Labs.
 *
 * The published demo app is a simulator build, so the default target is a Sauce Labs iOS
 * simulator. Real iPhones need a device build: upload a signed .ipa, then run with
 * SAUCE_IOS_REAL_DEVICE=true SAUCE_IOS_APP=<uploaded .ipa name> (Sauce re-signs it).
 */
const realDevice = envFlag('SAUCE_IOS_REAL_DEVICE');

export const config: WebdriverIO.Config = {
  ...sauceConfig,
  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': realDevice
        ? envOr('SAUCE_IOS_DEVICE', 'iPhone.*')
        : envOr('SAUCE_IOS_DEVICE', 'iPhone Simulator'),
      // Sauce Labs simulators pair each iOS version with specific Appium versions
      // (see scripts/sauce-list-platforms.mjs); iOS 26.1 runs on Appium 2.19.0.
      'appium:platformVersion': envOr('SAUCE_IOS_VERSION', realDevice ? '18' : '26.1'),
      'appium:app': `storage:filename=${envOr(
        'SAUCE_IOS_APP',
        realDevice ? 'wdiodemoapp.ipa' : 'ios.simulator.wdio.native.app.zip',
      )}`,
      'appium:noReset': false,
      'appium:newCommandTimeout': 240,
      'sauce:options': {
        ...sauceOptions('iOS'),
        ...(!realDevice && { appiumVersion: envOr('SAUCE_APPIUM_VERSION', '2.19.0') }),
      },
    },
  ],
};
