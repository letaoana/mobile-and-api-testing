#!/usr/bin/env node
/**
 * Downloads the WebdriverIO Native Demo App builds into ./apps.
 *
 * Usage:
 *   npm run app:download                 # Android + iOS simulator build
 *   npm run app:download -- android      # Android only
 *   APP_VERSION=v2.2.0 npm run app:download
 */
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const VERSION = process.env.APP_VERSION ?? 'v2.2.0';
const RELEASES = 'https://github.com/webdriverio/native-demo-app/releases/download';
const APPS_DIR = resolve(process.cwd(), 'apps');

const BUILDS = {
  android: {
    asset: `android.wdio.native.app.${VERSION}.apk`,
    target: 'android.wdio.native.app.apk',
  },
  ios: {
    asset: `ios.simulator.wdio.native.app.${VERSION}.zip`,
    target: 'ios.simulator.wdio.native.app.zip',
  },
};

const requested = process.argv.slice(2);
const platforms = requested.length ? requested : Object.keys(BUILDS);

mkdirSync(APPS_DIR, { recursive: true });

for (const platform of platforms) {
  const build = BUILDS[platform];
  if (!build) {
    console.error(`Unknown platform "${platform}". Use one of: ${Object.keys(BUILDS).join(', ')}`);
    process.exit(1);
  }

  const destination = resolve(APPS_DIR, build.target);
  if (existsSync(destination) && !process.env.FORCE_DOWNLOAD) {
    console.log(`✔ ${platform}: ${build.target} already present (set FORCE_DOWNLOAD=1 to replace)`);
    continue;
  }

  const url = `${RELEASES}/${VERSION}/${build.asset}`;
  console.log(`↓ ${platform}: ${url}`);
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    console.error(`✖ ${platform}: download failed with HTTP ${response.status}`);
    process.exit(1);
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination));
  console.log(`✔ ${platform}: saved to apps/${build.target}`);
}
