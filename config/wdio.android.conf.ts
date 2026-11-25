import { resolve } from 'node:path';
import { ensureAndroidDevice } from './android-device.ts';
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

  /** Starts an emulator when no device is connected, or stops early if there is none to start. */
  async onPrepare(config, capabilities) {
    for (const hook of [sharedConfig.onPrepare ?? []].flat()) {
      await hook.call(this, config, capabilities);
    }
    const startedUdid = await ensureAndroidDevice();
    if (startedUdid && Array.isArray(capabilities)) {
      for (const capability of capabilities as WebdriverIO.Capabilities[]) {
        capability['appium:udid'] ??= startedUdid;
      }
    }
  },
};
