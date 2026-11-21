#!/usr/bin/env node
/**
 * Prints what the Sauce Labs account can run in its data centre: real Android/iOS devices
 * that are available right now, and the Appium and simulator/emulator versions on offer.
 * Used in CI before a run so device and version choices are easy to check.
 */
import { existsSync } from 'node:fs';

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
const api = `https://api.${region}.saucelabs.com`;
const headers = { Authorization: `Basic ${Buffer.from(`${user}:${key}`).toString('base64')}` };

async function get(path) {
  const response = await fetch(`${api}${path}`, { headers });
  if (!response.ok) {
    console.log(`  ${path}: HTTP ${response.status} ${(await response.text()).slice(0, 200)}`);
    return undefined;
  }
  return response.json();
}

console.log(`Sauce Labs ${region}\n`);

const devices = await get('/v1/rdc/devices');
const available = new Set((await get('/v1/rdc/devices/available')) ?? []);
if (Array.isArray(devices)) {
  console.log('Real devices (* = available now):');
  for (const d of devices
    .filter((d) => ['ANDROID', 'IOS'].includes(d.os))
    .sort((a, b) => `${a.os}${a.name}`.localeCompare(`${b.os}${b.name}`))) {
    console.log(
      `  ${available.has(d.id) ? '*' : ' '} ${d.os} ${d.osVersion}  ${d.name}  (${d.id})`,
    );
  }
}

const platforms = await get('/rest/v1/info/platforms/appium');
if (Array.isArray(platforms)) {
  const summary = new Map();
  for (const p of platforms) {
    const k = `${p.api_name}  ${p.long_name}`;
    summary.set(k, [...(summary.get(k) ?? []), p.short_version].filter(Boolean));
  }
  console.log('\nEmulators / simulators (Appium):');
  for (const [name, versions] of summary) {
    console.log(`  ${name}: ${[...new Set(versions)].sort().join(', ')}`);
  }
}
