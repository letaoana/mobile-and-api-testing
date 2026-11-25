#!/usr/bin/env node
/**
 * Checks that everything needed to run the tests is installed and configured, on macOS,
 * Windows and Linux. It only reports: nothing is installed or changed.
 *
 * Usage:
 *   npm run doctor                    # API + Android (+ iOS on macOS)
 *   npm run doctor -- android         # targets: api, android, ios, sauce, browserstack
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const isMac = process.platform === 'darwin';
const requested = process.argv.slice(2);
const targets = requested.length ? requested : ['api', 'android', ...(isMac ? ['ios'] : [])];
const known = ['api', 'android', 'ios', 'sauce', 'browserstack'];
const unknown = targets.filter((t) => !known.includes(t));
if (unknown.length) {
  console.error(`Unknown target(s): ${unknown.join(', ')}. Use: ${known.join(', ')}`);
  process.exit(2);
}

let failures = 0;
const ok = (message) => console.log(`  ✔ ${message}`);
const warn = (message, fix) => console.log(`  ! ${message}${fix ? `\n      → ${fix}` : ''}`);
const fail = (message, fix) => {
  failures += 1;
  console.log(`  ✖ ${message}${fix ? `\n      → ${fix}` : ''}`);
};

/** Runs a command and returns its combined output, or undefined if it is not available. */
function run(command, args = []) {
  const result = spawnSync(command, args, { encoding: 'utf8', shell: false, timeout: 20_000 });
  if (result.error || result.status !== 0) return undefined;
  return `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
}

const versionOf = (text) =>
  text
    ?.match(/(\d+)\.(\d+)(?:\.(\d+))?/)
    ?.slice(1)
    .map(Number);
const atLeast = (version, minimum) => {
  for (let i = 0; i < minimum.length; i++) {
    if ((version[i] ?? 0) !== minimum[i]) return (version[i] ?? 0) > minimum[i];
  }
  return true;
};

function checkCommon() {
  console.log('\nProject');
  const node = versionOf(process.version);
  if (atLeast(node, [22, 22, 2])) ok(`Node.js ${process.version}`);
  else
    fail(`Node.js ${process.version} is too old`, 'Install Node.js 22.22.2 or newer (see .nvmrc)');

  if (existsSync(join('node_modules', '.bin', isWindows() ? 'wdio.cmd' : 'wdio'))) {
    ok('Dependencies installed');
  } else {
    fail('Dependencies not installed', 'Run: npm ci');
  }
}

function isWindows() {
  return process.platform === 'win32';
}

async function checkApi() {
  console.log('\nAPI tests');
  const baseUrl = process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com';
  try {
    const response = await fetch(`${baseUrl}/ping`, { signal: AbortSignal.timeout(10_000) });
    if (response.status < 500) ok(`${baseUrl} is reachable`);
    else
      warn(
        `${baseUrl} answered HTTP ${response.status}`,
        'The public API may be down; retry later',
      );
  } catch {
    warn(`${baseUrl} is not reachable`, 'Check your network, or set HTTPS_PROXY behind a proxy');
  }
}

function checkApp(pathVariable, file, platform) {
  const path = process.env[pathVariable] || join('apps', file);
  if (existsSync(path)) ok(`App build ${path}`);
  else
    fail(
      `App build ${path} missing`,
      `Run: npm run app:download -- ${platform}, or set ${pathVariable}`,
    );
}

function checkAndroid() {
  console.log('\nAndroid');
  const java = run('java', ['-version']);
  const javaVersion = java
    ?.match(/version "(\d+)(?:\.(\d+))?/)
    ?.slice(1)
    .filter(Boolean);
  if (!java) {
    fail('Java not found', 'Install a JDK 17+ (e.g. Temurin) and set JAVA_HOME');
  } else if (javaVersion && atLeast(javaVersion.map(Number), [17])) {
    ok(`Java ${javaVersion.join('.')}`);
  } else {
    fail(
      `Java ${javaVersion?.join('.') ?? '(unknown version)'} is too old`,
      'Install a JDK 17 or newer',
    );
  }
  if (!process.env.JAVA_HOME) warn('JAVA_HOME is not set', 'Point JAVA_HOME at your JDK folder');

  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (sdk && existsSync(sdk)) ok(`Android SDK at ${sdk}`);
  else {
    fail(
      'ANDROID_HOME is not set to an Android SDK',
      'Install Android Studio (or the command-line tools) and set ANDROID_HOME to the SDK folder',
    );
  }

  const adbPath = sdk ? join(sdk, 'platform-tools', isWindows() ? 'adb.exe' : 'adb') : 'adb';
  const devices = run(existsSync(adbPath) ? adbPath : 'adb', ['devices']);
  if (devices === undefined) {
    fail('adb not found', 'Install "Android SDK Platform-Tools" with the SDK Manager');
  } else {
    const attached = devices
      .split('\n')
      .slice(1)
      .map((line) => line.trim().split(/\s+/))
      .filter(([id, state]) => id && /^(device|unauthorized|offline)$/.test(state ?? ''));
    const ready = attached.filter(([, state]) => state === 'device');
    const unauthorized = attached.filter(([, state]) => state === 'unauthorized');
    const offline = attached.filter(([, state]) => state === 'offline');
    for (const [id] of ready)
      ok(`${id.startsWith('emulator-') ? 'Emulator' : 'Device'} ${id} connected`);
    for (const [id] of unauthorized) {
      fail(`Device ${id} is unauthorized`, 'Unlock the phone and accept the USB debugging prompt');
    }
    for (const [id] of offline) {
      fail(
        `Device ${id} is offline`,
        'Reconnect it, or run: adb kill-server, then adb start-server',
      );
    }
    if (!attached.length) {
      const emulatorPath = sdk
        ? join(sdk, 'emulator', isWindows() ? 'emulator.exe' : 'emulator')
        : '';
      const avds = (run(existsSync(emulatorPath) ? emulatorPath : 'emulator', ['-list-avds']) ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !/^(INFO|WARNING|ERROR)\b/.test(line));
      const autoStart = !/^(false|0|no)$/i.test(process.env.ANDROID_AUTO_EMULATOR ?? '');
      if (avds.length && autoStart) {
        warn(
          'No Android device or emulator connected',
          `npm run test:android will start an emulator (${process.env.ANDROID_AVD || avds.join(', ')})`,
        );
      } else {
        fail(
          'No Android device or emulator connected',
          avds.length
            ? 'Connect a phone or start an emulator (ANDROID_AUTO_EMULATOR is off)'
            : 'Connect a phone with USB debugging on, or create an emulator (Android Studio → Device Manager)',
        );
      }
    } else if (ready.length > 1 && !process.env.ANDROID_UDID) {
      warn('Several devices connected', 'Set ANDROID_UDID to choose one');
    }
  }
  checkApp('ANDROID_APP_PATH', 'android.wdio.native.app.apk', 'android');
}

function checkIos() {
  console.log('\niOS');
  if (!isMac) {
    fail(
      'iOS tests need macOS with Xcode',
      'Run the iOS tests on a Mac, or in CI (mobile-ios.yml)',
    );
    return;
  }
  const xcode = run('xcodebuild', ['-version']);
  if (!xcode)
    fail(
      'Xcode not found',
      'Install Xcode from the App Store, then run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer',
    );
  else if (atLeast(versionOf(xcode), [16])) ok(xcode.split('\n')[0]);
  else fail(`${xcode.split('\n')[0]} is too old`, 'Update to Xcode 16 or newer');

  const udid = process.env.IOS_UDID;
  if (udid) {
    const devices = run('xcrun', ['xctrace', 'list', 'devices']) ?? '';
    if (devices.includes(udid)) ok(`iPhone ${udid} connected`);
    else
      fail(
        `iPhone ${udid} (IOS_UDID) not found`,
        'Connect and trust the device, enable Developer Mode',
      );
    if (!process.env.IOS_XCODE_ORG_ID)
      fail('IOS_XCODE_ORG_ID is not set', 'Set your Apple development team id');
    const ipa = process.env.IOS_APP_PATH;
    if (ipa?.toLowerCase().endsWith('.ipa') && existsSync(ipa)) ok(`Signed app ${ipa}`);
    else
      fail(
        'IOS_APP_PATH does not point to a signed .ipa',
        'Build and sign the demo app for your device',
      );
    return;
  }
  const simulators = run('xcrun', ['simctl', 'list', 'devices', 'available']) ?? '';
  const simulator = process.env.IOS_DEVICE_NAME || 'iPhone 16';
  if (simulators.includes(`${simulator} (`)) ok(`Simulator "${simulator}" available`);
  else {
    fail(
      `Simulator "${simulator}" not available`,
      'Set IOS_DEVICE_NAME to one listed by "xcrun simctl list devices available", or install a runtime in Xcode → Settings → Components',
    );
  }
  checkApp('IOS_APP_PATH', 'ios.simulator.wdio.native.app.zip', 'ios');
}

function checkCredentials(name, variables) {
  console.log(`\n${name}`);
  for (const [variable, fallback] of variables) {
    if (process.env[variable] || (fallback && process.env[fallback])) ok(`${variable} is set`);
    else fail(`${variable} is not set`, `Set it in your shell or in .env (see .env.example)`);
  }
}

checkCommon();
if (targets.includes('api')) await checkApi();
if (targets.includes('android')) checkAndroid();
if (targets.includes('ios')) checkIos();
if (targets.includes('sauce')) {
  checkCredentials('Sauce Labs', [
    ['SAUCE_LABS_USERNAME', 'SAUCE_USERNAME'],
    ['SAUCE_LABS_ACCESS_KEY', 'SAUCE_ACCESS_KEY'],
  ]);
  checkApp('ANDROID_APP_PATH', 'android.wdio.native.app.apk', 'android');
}
if (targets.includes('browserstack')) {
  checkCredentials('BrowserStack', [['BROWSERSTACK_USERNAME'], ['BROWSERSTACK_ACCESS_KEY']]);
  checkApp('ANDROID_APP_PATH', 'android.wdio.native.app.apk', 'android');
}

console.log(
  failures
    ? `\n${failures} problem(s) found. Fix them, then run "npm run doctor" again.`
    : '\nAll checks passed.',
);
process.exit(failures ? 1 : 0);
