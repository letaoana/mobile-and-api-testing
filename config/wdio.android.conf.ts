import { resolve } from 'node:path';
import { env, envOr } from './env.ts';
import { sharedConfig } from './wdio.shared.conf.ts';

const udid = env('ANDROID_UDID');
const platformVersion = env('ANDROID_PLATFORM_VERSION');

export const config: WebdriverIO.Config = {
  ...sharedConfig,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': envOr('ANDROID_DEVICE_NAME', 'Android Device'),
      ...(udid && { 'appium:udid': udid }),
      ...(platformVersion && { 'appium:platformVersion': platformVersion }),
      'appium:app': resolve(envOr('ANDROID_APP_PATH', './apps/android.wdio.native.app.apk')),
      'appium:autoGrantPermissions': true,
      // Start every spec file from a clean app state without reinstalling the APK.
      'appium:noReset': false,
      'appium:fullReset': false,
      'appium:newCommandTimeout': 240,
      'appium:uiautomator2ServerInstallTimeout': 120_000,
      'appium:adbExecTimeout': 120_000,
      'appium:disableWindowAnimation': true,
    },
  ],
};
