# Mobile & API Test Automation

[![Mobile tests](https://github.com/letaoana/mobile-and-api-testing/actions/workflows/mobile.yml/badge.svg?branch=main)](https://github.com/letaoana/mobile-and-api-testing/actions/workflows/mobile.yml)
[![Android](https://github.com/letaoana/mobile-and-api-testing/actions/workflows/mobile-android.yml/badge.svg?branch=main)](https://github.com/letaoana/mobile-and-api-testing/actions/workflows/mobile-android.yml)
[![iOS](https://github.com/letaoana/mobile-and-api-testing/actions/workflows/mobile-ios.yml/badge.svg?branch=main)](https://github.com/letaoana/mobile-and-api-testing/actions/workflows/mobile-ios.yml)
[![API tests](https://github.com/letaoana/mobile-and-api-testing/actions/workflows/api-tests.yml/badge.svg?branch=main)](https://github.com/letaoana/mobile-and-api-testing/actions/workflows/api-tests.yml)
[![Quality checks](https://github.com/letaoana/mobile-and-api-testing/actions/workflows/quality.yml/badge.svg?branch=main)](https://github.com/letaoana/mobile-and-api-testing/actions/workflows/quality.yml)

TypeScript test automation for the
[WebdriverIO Native Demo App](https://github.com/webdriverio/native-demo-app) (WebdriverIO 10 +
Appium 4, Mocha) and the [Restful Booker API](https://restful-booker.herokuapp.com/apidoc/index.html)
(Playwright `APIRequestContext` + Zod). Android and iOS share the same specs and screen objects; only
the capabilities differ.

## Getting started

| You want to run    | You need                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| API tests          | Node.js 22.22.2+ (`.nvmrc`), on macOS, Windows or Linux                                                       |
| Android tests      | JDK 17+, Android SDK platform-tools with `ANDROID_HOME` set, and a phone with USB debugging on or an emulator |
| iOS tests          | macOS with Xcode 16+ and an iOS simulator runtime (a physical iPhone also needs a signed build, see below)    |
| Cloud real devices | A Sauce Labs or BrowserStack account; nothing installed beyond Node.js                                        |

```bash
npm ci                        # install dependencies (Appium and its drivers included)
npm run doctor                # check prerequisites; lists anything missing and how to fix it
npm run app:download          # demo app builds into ./apps

npm run test:api              # API tests; HTML report: npm run test:api:report
npm run test:android          # connected Android phone or running emulator
npm run test:ios              # iOS simulator (macOS only)
```

`npm run doctor -- android` (or `api`, `ios`, `sauce`, `browserstack`) checks one target. It only
reports what is missing; it never installs anything.

**Settings** come from environment variables with working defaults. The portable way to set them on
any OS is a `.env` file: copy `.env.example` to `.env` and fill in what you need (device UDID, app
path, platform version, cloud credentials, API host). Inline variables differ per shell:

```bash
ANDROID_UDID=R58N12ABCDE npm run test:android                      # macOS / Linux
$env:ANDROID_UDID="R58N12ABCDE"; npm run test:android              # Windows PowerShell
```

**Android setup.** Point `ANDROID_HOME` at the SDK (usually `~/Library/Android/sdk` on macOS,
`%LOCALAPPDATA%\Android\Sdk` on Windows) and `JAVA_HOME` at the JDK, and add the SDK's
`platform-tools` folder to `PATH` so `adb` works. On Windows, set them permanently in _System
Properties → Environment Variables_ (or with `setx`), then open a new terminal. Create an emulator in
Android Studio → Device Manager, or plug in a phone and accept the USB debugging prompt; `adb devices`
must list it. With nvm-windows, install the version in `.nvmrc` explicitly (`nvm install 22`).

**More ways to run**

```bash
npm run test:android -- --suite auth                               # suites: auth | forms | gestures
npm run test:android -- --spec tests/mobile/specs/swipe.spec.ts    # one spec file
RECORD_VIDEO=true npm run test:android                             # keep a video of every test (or set it in .env)
```

**Physical iPhone:** the published iOS build only runs on simulators. Build and sign the app from its
source, then set `IOS_UDID`, `IOS_APP_PATH` (the `.ipa`) and `IOS_XCODE_ORG_ID`.

## Cloud real devices: Sauce Labs or BrowserStack

The same tests run on either provider; switching needs no code changes.

| Provider     | Credentials                                        | Upload the app                | Run                                                           |
| ------------ | -------------------------------------------------- | ----------------------------- | ------------------------------------------------------------- |
| Sauce Labs   | `SAUCE_LABS_USERNAME`, `SAUCE_LABS_ACCESS_KEY`     | `npm run sauce:upload`        | `npm run test:sauce:android` / `test:sauce:ios` (simulator)   |
| BrowserStack | `BROWSERSTACK_USERNAME`, `BROWSERSTACK_ACCESS_KEY` | `npm run browserstack:upload` | `npm run test:browserstack:android` / `test:browserstack:ios` |

Uploads are skipped when the provider already has the build (BrowserStack: same app version; add
`-- --force` to replace a rebuilt app). Android runs on real devices with both
providers. For iOS, Sauce Labs uses a simulator by default, while BrowserStack only offers real
iPhones, which need a signed `.ipa` (`npm run browserstack:upload -- <path>.ipa`, then set
`BROWSERSTACK_IOS_APP`). Device and OS version are set with `SAUCE_*` / `BROWSERSTACK_*` variables
(see `.env.example`).

**In CI** (`mobile-cloud.yml`), add the provider's credentials as repository secrets
(`SAUCE_USERNAME` + `SAUCE_ACCESS_KEY`, or `BROWSERSTACK_USERNAME` + `BROWSERSTACK_ACCESS_KEY`). Pick
the provider per run in _Run workflow_, or set the `MOBILE_CLOUD_PROVIDER` repository variable
(`sauce` or `browserstack`) as the default.

## Scenarios

| Area   | Spec              | What is verified                                                                                                     |
| ------ | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| Mobile | `signup.spec.ts`  | A new user signs up and the success alert appears; mismatched passwords show an error                                |
| Mobile | `login.spec.ts`   | Valid credentials log in; a wrong password and an invalid email show their errors and no success alert               |
| Mobile | `forms.spec.ts`   | Text is echoed, the switch toggles, a dropdown option is selected, _Active_ shows its alert and the values persist   |
| Mobile | `swipe.spec.ts`   | Swipes move the carousel to the next/previous slide; scrolling reveals the hidden logo and text                      |
| Mobile | `drag.spec.ts`    | **Bonus:** all nine puzzle pieces are dropped in place, the success screen appears and _Retry_ resets the puzzle     |
| API    | `auth.spec.ts`    | `POST /auth` returns a token; each call returns a new one; a wrong password returns `Bad credentials` and no token   |
| API    | `booking.spec.ts` | `POST /booking` returns an id and a booking equal to the request; it can be read back; `additionalneeds` is optional |

**Why drag and drop as the bonus:** it is the only scenario that needs a press-hold-move-release
gesture between two specific elements, its outcome depends on precision (a piece only lands in its own
zone) and on state (success after all nine, reset on _Retry_), and the same gesture drives reorderable
lists and boards in real apps.

## How the tests are built

- **Layers.** Mobile: spec → screen object (`tests/mobile/screens`) → helpers. API: spec → fixture →
  client → `APIRequestContext`. Specs describe behaviour; selectors, URLs and headers live below them.
- **Cross-platform selectors.** Accessibility ids work on both platforms; the few platform differences
  (text, alerts, pickers, keyboard) are contained in helpers and screen objects, never in specs.
- **Reliable waits and isolation.** No fixed sleeps, only condition waits. The app is relaunched before
  each test, and sign-up data is unique per run.
- **Strong assertions.** Alerts are checked by title and message, negative tests also prove no success
  alert appeared, and API responses are validated against strict Zod schemas and compared to the request.
- **Shared-safe API tests.** Generated bookings are deleted after each test with a fresh token.
- **Evidence on failure.** Screenshot, page source and screen recording in `reports/mobile/artifacts/`;
  JUnit and HTML reports under `reports/`.
- **Quality gates.** Strict TypeScript, ESLint and Prettier: `npm run lint`, `npm run typecheck`,
  `npm run format:check`.

## Project layout

```
config/            WebdriverIO configs: shared, Android, iOS, cloud (Sauce Labs, BrowserStack)
tests/mobile/      specs/, screens/ (screen objects), helpers/, data/
tests/api/         specs/, clients/, fixtures/, schemas/ (Zod), data/
scripts/           doctor, app download, cloud uploads, Sauce Labs platform list, CI failure summaries
docs/evidence/     test execution evidence (logs, reports, screenshots)
.github/workflows/ CI pipelines
```

## Continuous integration

| Workflow             | Runs                                       | When                                                                       |
| -------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| `quality.yml`        | Lint, type-check, format check             | Every push and pull request                                                |
| `api-tests.yml`      | API tests                                  | Changes to API tests, Playwright config or dependencies                    |
| `mobile-android.yml` | Mobile suite on an Android emulator        | Pull requests and `main`, when mobile tests, config or dependencies change |
| `mobile-ios.yml`     | Mobile suite on an iOS simulator           | As for Android; manual runs can target one spec or test (`spec`, `grep`)   |
| `mobile.yml`         | Overall mobile status (Android and iOS)    | After each Android or iOS run                                              |
| `mobile-cloud.yml`   | Mobile suite on Sauce Labs or BrowserStack | Manually, or when the cloud setup changes                                  |

Every workflow can also be started manually and uploads its reports as artifacts. Badges show the
latest result on `main`.

## Results and known limitations

Evidence for every run is in [`docs/evidence`](docs/evidence/README.md): API 6/6; Android 10/10 on
Sauce Labs real devices and on the CI emulator; iOS 9/10 before the dropdown fix below, with the fixed
test passing on the CI simulator.

- **The demo app has no backend.** Any valid email with an 8+ character password logs in, and accounts
  are not stored. The "wrong password" case therefore uses a password the app rejects (under 8
  characters); the happy path signs up first and logs in with the same credentials.
- **iOS dropdown.** The picker opens only from the chevron icon, as a sheet closed with _Done_; both are
  tapped with XCUITest's native tap because they ignore element clicks.
- **iOS on Sauce Labs.** iOS simulators are no longer in the Sauce Labs plan used here; iOS 26.5 passed
  9/10 there before the dropdown fix. On iOS 26.1, keystrokes for the first password field land in the
  confirm field.
- **BrowserStack** is supported through its standard WebDriver hub (it has no WebdriverIO 10 service
  yet) and has not been run against a BrowserStack account for this project.
- **Restful Booker is a shared public sandbox.** It resets periodically and can be slow; CI retries a
  failed API test once.
