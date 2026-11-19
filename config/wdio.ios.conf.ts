import { resolve } from 'node:path';
import { env, envOr } from './env.ts';
import { sharedConfig } from './wdio.shared.conf.ts';

/**
 * iOS runs on a simulator by default because the published demo build is a
 * simulator build. Setting IOS_UDID switches to a physical device, which needs
 * a signed .ipa (IOS_APP_PATH) and a development team (IOS_XCODE_ORG_ID).
 */
const udid = env('IOS_UDID');
const platformVersion = env('IOS_PLATFORM_VERSION');
const isRealDevice = Boolean(udid);

const realDeviceCapabilities = isRealDevice
  ? {
      'appium:udid': udid,
      'appium:xcodeOrgId': env('IOS_XCODE_ORG_ID'),
      'appium:xcodeSigningId': envOr('IOS_XCODE_SIGNING_ID', 'Apple Development'),
      'appium:updatedWDABundleId': env('IOS_WDA_BUNDLE_ID'),
    }
  : {};

export const config: WebdriverIO.Config = {
  ...sharedConfig,
  // The first session on a fresh simulator also builds and launches WebDriverAgent.
  connectionRetryTimeout: 300_000,
  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': envOr('IOS_DEVICE_NAME', 'iPhone 16'),
      ...(platformVersion && { 'appium:platformVersion': platformVersion }),
      'appium:app': resolve(envOr('IOS_APP_PATH', './apps/ios.simulator.wdio.native.app.zip')),
      'appium:autoAcceptAlerts': false,
      'appium:noReset': false,
      'appium:newCommandTimeout': 240,
      'appium:wdaLaunchTimeout': 180_000,
      'appium:wdaConnectionTimeout': 180_000,
      ...realDeviceCapabilities,
    },
  ],
};
