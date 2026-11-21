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
      'appium:platformVersion': envOr('SAUCE_IOS_VERSION', realDevice ? '18' : '18.6'),
      'appium:app': `storage:filename=${envOr(
        'SAUCE_IOS_APP',
        realDevice ? 'wdiodemoapp.ipa' : 'ios.simulator.wdio.native.app.zip',
      )}`,
      'appium:noReset': false,
      'appium:newCommandTimeout': 240,
      'sauce:options': sauceOptions('iOS'),
    },
  ],
};
