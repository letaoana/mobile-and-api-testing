#!/usr/bin/env node
/**
 * Uploads app builds to BrowserStack App Automate under a custom id per platform and app
 * version (APP_VERSION), which the BrowserStack configs use as `appium:app`. An id that is
 * already stored is skipped; pass --force to replace it with a rebuilt app.
 *
 * Usage:
 *   npm run browserstack:upload                    # Android APK from ./apps
 *   npm run browserstack:upload -- ./apps/my.ipa   # signed iOS build (real devices only)
 *   npm run browserstack:upload -- --force         # upload again
 */
import { existsSync, openAsBlob } from 'node:fs';
import { basename, extname, resolve } from 'node:path';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const user = process.env.BROWSERSTACK_USERNAME;
const key = process.env.BROWSERSTACK_ACCESS_KEY;
if (!user || !key) {
  console.error('Set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY first.');
  process.exit(1);
}

const version = process.env.APP_VERSION || 'v2.2.0';
const api = 'https://api-cloud.browserstack.com/app-automate';
const auth = `Basic ${Buffer.from(`${user}:${key}`).toString('base64')}`;

const force = process.argv.includes('--force');
const requested = process.argv.slice(2).filter((arg) => arg !== '--force');
const files = (requested.length ? requested : ['android']).map((arg) => {
  if (arg === 'android') return resolve('apps/android.wdio.native.app.apk');
  if (arg === 'ios') {
    console.error(
      '✖ BrowserStack runs iOS on real devices only; pass the path to a signed .ipa instead.',
    );
    process.exit(1);
  }
  return resolve(arg);
});

for (const file of files) {
  if (!existsSync(file)) {
    console.error(`✖ ${file} not found. Run "npm run app:download" first.`);
    process.exit(1);
  }
  const extension = extname(file).toLowerCase();
  if (!['.apk', '.ipa', '.aab'].includes(extension)) {
    console.error(`✖ ${basename(file)}: BrowserStack accepts .apk, .aab or .ipa files.`);
    process.exit(1);
  }
  const customId = `wdio-native-demo-${extension === '.ipa' ? 'ios' : 'android'}-${version}`;

  const existing = await fetch(`${api}/recent_apps/${customId}`, {
    headers: { Authorization: auth },
  });
  const stored = existing.ok ? await existing.json() : [];
  if (!force && Array.isArray(stored) && stored.length > 0) {
    console.log(`✔ ${basename(file)} already on BrowserStack as "${customId}"; upload skipped`);
    continue;
  }

  const form = new FormData();
  form.append('file', await openAsBlob(file), basename(file));
  form.append('custom_id', customId);
  console.log(`↑ ${basename(file)} → BrowserStack App Automate`);
  const response = await fetch(`${api}/upload`, {
    method: 'POST',
    headers: { Authorization: auth },
    body: form,
  });
  if (!response.ok) {
    console.error(`✖ Upload failed with HTTP ${response.status} ${await response.text()}`);
    process.exit(1);
  }
  const { app_url: appUrl } = await response.json();
  console.log(`✔ Uploaded as "${customId}" (${appUrl})`);
  if (extension === '.ipa') {
    console.log(`  Set BROWSERSTACK_IOS_APP=${customId} to run the iOS tests on BrowserStack.`);
  }
}
