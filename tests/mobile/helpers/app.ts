const APP_ID = {
  android: 'com.wdiodemoapp',
  ios: 'org.wdiodemoapp',
} as const;

/**
 * Restarts the app so every test starts from the home screen with fresh state.
 * Within one spec file the session (and app process) is shared, so without this
 * a value set by one test (e.g. a switch) would leak into the next.
 */
export async function relaunchApp(): Promise<void> {
  const appId = driver.isAndroid ? APP_ID.android : APP_ID.ios;
  await driver.terminateApp(appId);
  await driver.activateApp(appId);
}
