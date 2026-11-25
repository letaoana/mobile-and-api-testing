import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SevereServiceError } from 'webdriverio';
import { env, envFlag, envOr, isCI } from './env.ts';

/**
 * Makes sure an Android device is available before any Appium session starts.
 *
 * - A phone or emulator is already connected, or ANDROID_UDID is set: nothing changes.
 * - Nothing is connected but an emulator (AVD) exists: it is started and the run waits until
 *   Android has booted, so `npm run test:android` works without opening Android Studio first.
 * - Nothing is connected and no emulator exists: the run stops at once with what to do, instead of
 *   every spec file failing after Appium's connection retries.
 *
 * Settings: ANDROID_AUTO_EMULATOR=false turns the start-up off, ANDROID_AVD picks the emulator
 * (default: the newest Android version), ANDROID_EMULATOR_BOOT_TIMEOUT is in seconds.
 */

export interface AdbDevice {
  serial: string;
  state: string;
}

export type DevicePlan =
  | { action: 'use-connected' }
  | { action: 'start-emulator'; avd: string }
  | { action: 'wait-for-emulator'; serial: string }
  | { action: 'fail'; message: string };

const SETUP_HINT = 'Run `npm run doctor -- android` for a full check.';

/** Decides what to do from the connected devices and installed emulators. Pure, for testing. */
export function planAndroidDevice(
  devices: AdbDevice[],
  avds: string[],
  preferredAvd?: string,
): DevicePlan {
  if (devices.some((d) => d.state === 'device')) return { action: 'use-connected' };

  const phone = devices.find((d) => !d.serial.startsWith('emulator-'));
  if (phone?.state === 'unauthorized') {
    return {
      action: 'fail',
      message: `Phone ${phone.serial} is unauthorized: unlock it and accept the USB debugging prompt. ${SETUP_HINT}`,
    };
  }
  if (phone) {
    return {
      action: 'fail',
      message: `Phone ${phone.serial} is ${phone.state}: reconnect it, or run adb kill-server then adb start-server. ${SETUP_HINT}`,
    };
  }

  // An emulator that is still booting shows as offline: wait for it rather than start another.
  const booting = devices.find((d) => d.serial.startsWith('emulator-'));
  if (booting) return { action: 'wait-for-emulator', serial: booting.serial };

  if (!avds.length) {
    return {
      action: 'fail',
      message:
        'No Android device is connected and no emulator is installed. Connect a phone with USB ' +
        'debugging on, or create an emulator in Android Studio > Device Manager. ' +
        SETUP_HINT,
    };
  }

  if (preferredAvd) {
    const normalise = (s: string) => s.toLowerCase().replace(/[\s_-]/g, '');
    const wanted = normalise(preferredAvd);
    const avd =
      avds.find((a) => normalise(a) === wanted) ?? avds.find((a) => normalise(a).includes(wanted));
    if (!avd) {
      return {
        action: 'fail',
        message: `ANDROID_AVD="${preferredAvd}" matches no emulator. Installed: ${avds.join(', ')}.`,
      };
    }
    return { action: 'start-emulator', avd };
  }

  const apiLevel = (avd: string) => Number(/API_(\d+)/i.exec(avd)?.[1] ?? 0);
  const newest = [...avds].sort((a, b) => apiLevel(b) - apiLevel(a))[0];
  return { action: 'start-emulator', avd: newest };
}

const exe = (name: string) => (process.platform === 'win32' ? `${name}.exe` : name);

function sdkTool(sdk: string | undefined, folder: string, name: string): string {
  const path = sdk ? join(sdk, folder, exe(name)) : '';
  return path && existsSync(path) ? path : name;
}

function output(command: string, args: string[]): string | undefined {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 20_000 });
  if (result.error || result.status !== 0) return undefined;
  return result.stdout;
}

function listDevices(adb: string): AdbDevice[] | undefined {
  return output(adb, ['devices'])
    ?.split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state)
    .map(([serial, state]) => ({ serial, state }));
}

function listAvds(emulator: string): string[] {
  return (output(emulator, ['-list-avds']) ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^(INFO|WARNING|ERROR)\b/.test(line));
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Waits for the emulator with the given UDID, or the one running the given AVD, to finish booting. */
async function waitForBoot(
  adb: string,
  target: { avd: string; serial?: undefined } | { serial: string; avd?: undefined },
  timeoutSeconds: number,
): Promise<string> {
  const deadline = Date.now() + timeoutSeconds * 1000;
  const { avd } = target;
  let serial = target.serial;
  while (Date.now() < deadline) {
    serial ??= (listDevices(adb) ?? [])
      .filter((d) => d.serial.startsWith('emulator-'))
      .find(
        (d) => output(adb, ['-s', d.serial, 'emu', 'avd', 'name'])?.split('\n')[0].trim() === avd,
      )?.serial;
    if (
      serial &&
      output(adb, ['-s', serial, 'shell', 'getprop', 'sys.boot_completed'])?.trim() === '1'
    ) {
      // Freshly booted emulators often show "Pixel Launcher / System UI isn't responding" over the
      // app, hiding the elements the tests look for. Hide such dialogs (as CI does), close any on
      // screen, then wake and unlock the screen.
      output(adb, ['-s', serial, 'shell', 'settings', 'put', 'global', 'hide_error_dialogs', '1']);
      output(adb, [
        '-s',
        serial,
        'shell',
        'am',
        'broadcast',
        '-a',
        'android.intent.action.CLOSE_SYSTEM_DIALOGS',
      ]);
      output(adb, ['-s', serial, 'shell', 'input', 'keyevent', '82']);
      return serial;
    }
    await sleep(2_000);
  }
  throw new SevereServiceError(
    `Emulator ${avd ?? serial} did not finish booting within ${timeoutSeconds}s. ` +
      'Start it once from Android Studio to check it works, or raise ANDROID_EMULATOR_BOOT_TIMEOUT.',
  );
}

/** Returns the UDID of an emulator it started, or undefined when a device was already available. */
export async function ensureAndroidDevice(): Promise<string | undefined> {
  // An explicit device choice wins; Appium reports clearly if that device is missing.
  if (env('ANDROID_UDID')) return undefined;
  // On by default; ANDROID_AUTO_EMULATOR=false (or 0/no) turns it off.
  if (env('ANDROID_AUTO_EMULATOR') && !envFlag('ANDROID_AUTO_EMULATOR')) return undefined;

  const sdk = env('ANDROID_HOME') ?? env('ANDROID_SDK_ROOT');
  const adb = sdkTool(sdk, 'platform-tools', 'adb');
  const devices = listDevices(adb);
  if (!devices) {
    throw new SevereServiceError(`adb was not found or failed to run. ${SETUP_HINT}`);
  }

  const plan = planAndroidDevice(
    devices,
    listAvds(sdkTool(sdk, 'emulator', 'emulator')),
    env('ANDROID_AVD'),
  );
  if (plan.action === 'use-connected') return undefined;
  if (plan.action === 'fail') throw new SevereServiceError(plan.message);
  if (plan.action === 'wait-for-emulator') {
    console.log(`Emulator ${plan.serial} is still starting: waiting for it to boot...`);
    const timeout = Number(envOr('ANDROID_EMULATOR_BOOT_TIMEOUT', '240'));
    return waitForBoot(adb, { serial: plan.serial }, timeout);
  }

  console.log(
    `No Android device connected: starting emulator ${plan.avd} and waiting for it to boot...`,
  );
  return startEmulator(plan.avd);
}

/** Starts an emulator in the background and resolves with its UDID once Android has booted. */
export async function startEmulator(avd: string): Promise<string> {
  const sdk = env('ANDROID_HOME') ?? env('ANDROID_SDK_ROOT');
  const timeout = Number(envOr('ANDROID_EMULATOR_BOOT_TIMEOUT', '240'));
  const started = Date.now();
  const args = ['-avd', avd, '-no-boot-anim', ...(isCI ? ['-no-window'] : [])];
  spawn(sdkTool(sdk, 'emulator', 'emulator'), args, { detached: true, stdio: 'ignore' }).unref();
  const serial = await waitForBoot(sdkTool(sdk, 'platform-tools', 'adb'), { avd }, timeout);
  console.log(
    `Emulator ${avd} (${serial}) is ready after ${Math.round((Date.now() - started) / 1000)}s. ` +
      'It keeps running after the tests for faster re-runs.',
  );
  return serial;
}
