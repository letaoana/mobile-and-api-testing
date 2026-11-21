const APP_ID = {
  android: 'com.wdiodemoapp',
  ios: 'org.wdiodemoapp',
} as const;

/** Gives each test a fresh app: tests in one spec file otherwise share the app's state. */
export async function relaunchApp(): Promise<void> {
  const appId = driver.isAndroid ? APP_ID.android : APP_ID.ios;
  await driver.terminateApp(appId);
  await driver.activateApp(appId);
}
