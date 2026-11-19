import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { envFlag, isCI } from './env.ts';

const REPORTS_DIR = join(process.cwd(), 'reports', 'mobile');
const ARTIFACTS_DIR = join(REPORTS_DIR, 'artifacts');
const recordEveryTest = envFlag('RECORD_VIDEO');

/** Turns a test title into a safe file name. */
const toFileName = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** Saves a screenshot and the UI hierarchy, which shows why a locator did not match. */
async function saveFailureEvidence(name: string): Promise<void> {
  await driver
    .saveScreenshot(join(ARTIFACTS_DIR, `${name}.png`))
    .catch((error: Error) => console.warn(`Screenshot failed: ${error.message}`));
  await driver
    .getPageSource()
    .then((source) => writeFile(join(ARTIFACTS_DIR, `${name}.xml`), source))
    .catch((error: Error) => console.warn(`Page source failed: ${error.message}`));
}

/**
 * Configuration shared by every platform. Platform files only add capabilities
 * and anything that is genuinely platform specific.
 */
export const sharedConfig: Omit<WebdriverIO.Config, 'capabilities'> = {
  runner: 'local',
  tsConfigPath: './tsconfig.json',

  specs: ['../tests/mobile/specs/**/*.spec.ts'],
  suites: {
    auth: ['../tests/mobile/specs/signup.spec.ts', '../tests/mobile/specs/login.spec.ts'],
    forms: ['../tests/mobile/specs/forms.spec.ts'],
    gestures: ['../tests/mobile/specs/swipe.spec.ts', '../tests/mobile/specs/drag.spec.ts'],
  },

  // A single physical device can only run one session at a time.
  maxInstances: 1,

  logLevel: 'warn',
  outputDir: join(REPORTS_DIR, 'logs'),
  bail: 0,
  waitforTimeout: 15_000,
  connectionRetryTimeout: 180_000,
  connectionRetryCount: 2,
  // Re-run a failed spec file once on CI to absorb emulator/simulator start-up noise.
  specFileRetries: isCI ? 1 : 0,

  services: [
    [
      'appium',
      {
        // Uses the Appium server and drivers installed in this project (see package.json).
        command: 'appium',
        logPath: REPORTS_DIR,
        args: { relaxedSecurity: false, logTimestamp: true },
      },
    ],
  ],

  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 180_000,
  },

  reporters: [
    'spec',
    [
      'junit',
      {
        outputDir: join(REPORTS_DIR, 'junit'),
        outputFileFormat: ({ cid }: { cid: string }) => `results-${cid}.xml`,
      },
    ],
  ],

  onPrepare() {
    mkdirSync(ARTIFACTS_DIR, { recursive: true });
  },

  async beforeTest() {
    try {
      await driver.startRecordingScreen();
    } catch (error) {
      // Recording is evidence only; a missing recorder (e.g. ffmpeg on iOS) must not fail tests.
      console.warn(`Screen recording unavailable: ${(error as Error).message}`);
    }
  },

  /**
   * Keeps evidence for every failure (screenshot + screen recording) and, when
   * RECORD_VIDEO=true, a recording of passing tests as well. The screenshot is
   * taken first so it survives even if the recording cannot be retrieved.
   */
  async afterTest(test, _context, { passed }) {
    const name = `${toFileName(test.parent)}--${toFileName(test.title)}`;

    if (!passed) {
      await saveFailureEvidence(name);
    }

    try {
      const video = await driver.stopRecordingScreen();
      if (video && (!passed || recordEveryTest)) {
        await writeFile(join(ARTIFACTS_DIR, `${name}.mp4`), video, 'base64');
      }
    } catch (error) {
      console.warn(`Screen recording could not be saved: ${(error as Error).message}`);
    }
  },

  /** `afterTest` does not run when a hook fails, so capture evidence for hook failures here. */
  async afterHook(test, _context, { error }) {
    if (error) {
      await saveFailureEvidence(`${toFileName(test.parent)}--${toFileName(test.title)}`);
    }
  },
};
