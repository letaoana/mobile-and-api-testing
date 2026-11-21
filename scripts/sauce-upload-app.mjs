#!/usr/bin/env node
/**
 * Uploads the demo app builds from ./apps to Sauce Labs App Storage, where the Sauce
 * configs reference them as `storage:filename=<name>`.
 *
 * Usage:
 *   npm run sauce:upload                  # Android APK + iOS simulator build
 *   npm run sauce:upload -- android       # Android only
 *   npm run sauce:upload -- ./apps/my.ipa # any file
 *
 * Needs SAUCE_LABS_USERNAME / SAUCE_LABS_ACCESS_KEY (or SAUCE_USERNAME / SAUCE_ACCESS_KEY)
 * and optionally SAUCE_REGION (default eu-central-1).
 */
import { existsSync, openAsBlob } from 'node:fs';
import { basename, resolve } from 'node:path';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const user = process.env.SAUCE_LABS_USERNAME || process.env.SAUCE_USERNAME;
const key = process.env.SAUCE_LABS_ACCESS_KEY || process.env.SAUCE_ACCESS_KEY;
const region = process.env.SAUCE_REGION || 'eu-central-1';
if (!user || !key) {
  console.error('Set SAUCE_LABS_USERNAME and SAUCE_LABS_ACCESS_KEY first.');
  process.exit(1);
}

const BUILDS = {
  android: 'apps/android.wdio.native.app.apk',
  ios: 'apps/ios.simulator.wdio.native.app.zip',
};
const requested = process.argv.slice(2);
const files = (requested.length ? requested : Object.keys(BUILDS)).map((arg) =>
  resolve(BUILDS[arg] ?? arg),
);

const endpoint = `https://api.${region}.saucelabs.com/v1/storage/upload`;
const auth = `Basic ${Buffer.from(`${user}:${key}`).toString('base64')}`;

for (const file of files) {
  if (!existsSync(file)) {
    console.error(`✖ ${file} not found. Run "npm run app:download" first.`);
    process.exit(1);
  }
  const name = basename(file);
  const form = new FormData();
  form.append('payload', await openAsBlob(file), name);
  form.append('name', name);

  console.log(`↑ ${name} → Sauce Labs App Storage (${region})`);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: auth },
    body: form,
  });
  if (!response.ok) {
    console.error(`✖ ${name}: upload failed with HTTP ${response.status} ${await response.text()}`);
    process.exit(1);
  }
  const { item } = await response.json();
  console.log(`✔ ${name} uploaded (id ${item.id}); use storage:filename=${name}`);
}
