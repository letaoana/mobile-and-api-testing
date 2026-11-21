import { envFlag, envOr } from './env.ts';
import { sauceConfig, sauceOptions } from './wdio.sauce.shared.conf.ts';

/**
 * The published demo app is a simulator build, so iOS defaults to a Sauce Labs simulator.
 * Real iPhones need an uploaded, signed .ipa: SAUCE_IOS_REAL_DEVICE=true SAUCE_IOS_APP=<name>.
 */
const realDevice = envFlag('SAUCE_IOS_REAL_DEVICE');

export const config: WebdriverIO.Config = {
  ...sauceConfig,
  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': envOr('SAUCE_IOS_DEVICE', realDevice ? 'iPhone.*' : 'iPhone Simulator'),
      // Sauce Labs simulators accept only the Appium version paired with each iOS version.
      'appium:platformVersion': envOr('SAUCE_IOS_VERSION', realDevice ? '18' : '26.5'),
      'appium:app': `storage:filename=${envOr(
        'SAUCE_IOS_APP',
        realDevice ? 'wdiodemoapp.ipa' : 'ios.simulator.wdio.native.app.zip',
      )}`,
      'appium:noReset': false,
      'appium:newCommandTimeout': 240,
      'sauce:options': {
        ...sauceOptions('iOS'),
        ...(!realDevice && { appiumVersion: envOr('SAUCE_APPIUM_VERSION', '3.3.0') }),
      },
    },
  ],
};
