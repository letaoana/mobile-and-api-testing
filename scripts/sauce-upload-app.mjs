#!/usr/bin/env node
/**
 * Uploads app builds to Sauce Labs App Storage. Files already stored with the same checksum
 * are skipped, as Sauce Labs allows only a few uploads per 15 minutes.
 *
 * Usage:
 *   npm run sauce:upload                  # Android APK + iOS simulator build
 *   npm run sauce:upload -- android       # Android only
 *   npm run sauce:upload -- ./apps/my.ipa # any file
 */
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, openAsBlob, statSync } from 'node:fs';
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

const api = `https://api.${region}.saucelabs.com/v1/storage`;
const auth = `Basic ${Buffer.from(`${user}:${key}`).toString('base64')}`;

const md5Of = (file) =>
  new Promise((done, fail) => {
    const hash = createHash('md5');
    createReadStream(file)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => done(hash.digest('hex')))
      .on('error', fail);
  });

/** Returns the stored file with this name and content, if Sauce Labs already has it. */
async function findStored(name, md5, size) {
  const response = await fetch(`${api}/files?q=${encodeURIComponent(name)}&per_page=25`, {
    headers: { Authorization: auth },
  });
  if (!response.ok) {
    return undefined;
  }
  const { items = [] } = await response.json();
  return items.find(
    (item) => item.name === name && (item.md5 ? item.md5 === md5 : item.size === size),
  );
}

for (const file of files) {
  if (!existsSync(file)) {
    console.error(`✖ ${file} not found. Run "npm run app:download" first.`);
    process.exit(1);
  }
  const name = basename(file);
  const stored = await findStored(name, await md5Of(file), statSync(file).size);
  if (stored) {
    console.log(`✔ ${name} already in Sauce Labs App Storage (id ${stored.id}); upload skipped`);
    continue;
  }

  const form = new FormData();
  form.append('payload', await openAsBlob(file), name);
  form.append('name', name);

  console.log(`↑ ${name} → Sauce Labs App Storage (${region})`);
  const response = await fetch(`${api}/upload`, {
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
