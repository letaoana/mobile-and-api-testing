# Mobile & API Test Automation

TypeScript test automation for two targets:

| Part       | Target                                                                        | Stack                                                     |
| ---------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1 – Mobile | [WebdriverIO Native Demo App](https://github.com/webdriverio/native-demo-app) | WebdriverIO 10, Appium 4 (UiAutomator2 / XCUITest), Mocha |
| 2 – API    | [Restful Booker](https://restful-booker.herokuapp.com/apidoc/index.html)      | Playwright Test (`APIRequestContext`), Zod                |

Android is the primary platform (physical device). iOS is supported from the same specs and screen
objects (bonus): only the capabilities differ.

---

## Contents

- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Part 1 – Mobile tests](#part-1--mobile-tests)
- [Part 2 – API tests](#part-2--api-tests)
- [Test design and best practices](#test-design-and-best-practices)
- [Continuous integration](#continuous-integration)
- [Test execution evidence](#test-execution-evidence)
- [Known app behaviour and limitations](#known-app-behaviour-and-limitations)

---

## Project structure

```
.
├── config/
│   ├── env.ts                    # Loads optional .env and reads variables
│   ├── wdio.shared.conf.ts       # Runner, Appium service, reporters, failure evidence
│   ├── wdio.android.conf.ts      # Android capabilities (UiAutomator2)
│   ├── wdio.ios.conf.ts          # iOS capabilities (XCUITest, simulator or real device)
│   └── wdio.sauce.*.conf.ts      # Sauce Labs: shared settings, Android and iOS capabilities
├── tests/
│   ├── mobile/
│   │   ├── specs/                # One spec file per feature
│   │   ├── screens/              # Screen objects (Page Object Model)
│   │   │   └── components/       # Shared UI: tab bar, native alert
│   │   ├── helpers/              # Selectors, app relaunch, keyboard, viewport checks
│   │   └── data/                 # Test data builders
│   └── api/
│       ├── specs/                # auth.spec.ts, booking.spec.ts
│       ├── clients/              # Endpoint clients (AuthClient, BookingClient)
│       ├── fixtures/             # Playwright fixtures (clients + automatic clean-up)
│       ├── schemas/              # Zod response contracts
│       └── data/                 # Booking factory, credentials
├── scripts/
│   ├── download-app.mjs          # Downloads the demo app builds into ./apps
│   ├── sauce-upload-app.mjs      # Uploads the app builds to Sauce Labs App Storage
│   └── summarise-page-source.mjs # Prints the UI hierarchy captured for failed tests (CI)
├── playwright.config.ts          # API test configuration
├── docs/evidence/                # Test execution evidence
├── .github/workflows/            # CI: API, Android emulator, iOS simulator
└── .env.example                  # Every supported environment variable
```

---

## Prerequisites

| Tool           | Version                                    | Needed for       |
| -------------- | ------------------------------------------ | ---------------- |
| Node.js        | 22.22.2+ (see `.nvmrc`)                    | everything       |
| Java JDK       | 17+ (`JAVA_HOME` set)                      | Android          |
| Android SDK    | platform-tools (`adb`), `ANDROID_HOME` set | Android          |
| Android device | Android 13+, USB debugging on              | Android          |
| Xcode          | 16+ with an iOS 18 simulator               | iOS (macOS only) |

Appium and its drivers are **project dependencies**, so no global Appium install is required. The
WebdriverIO Appium service starts and stops the server automatically.

### Preparing an Android physical device

1. Enable **Developer options** (tap _Build number_ seven times) and turn on **USB debugging**.
   On Xiaomi/Oppo devices also enable **USB debugging (Security settings)** / **Install via USB**.
2. Connect the device and accept the RSA prompt.
3. Check that it is listed:

   ```bash
   adb devices
   # List of devices attached
   # R58N12ABCDE    device
   ```

4. Optional: run `npm run appium:doctor` to confirm the Android toolchain is set up correctly.

---

## Installation

```bash
git clone https://github.com/letaoana/mobile-and-api-testing.git
cd mobile-and-api-testing
npm ci

# Download the demo app (v2.2.0) into ./apps
npm run app:download            # Android APK + iOS simulator build
npm run app:download -- android # Android only
```

Optional: copy `.env.example` to `.env` to set a device UDID, a different app path, and so on. Every
variable has a sensible default, so the file is not required.

---

## Part 1 – Mobile tests

### Running

```bash
# Android: the only connected device / running emulator is used
npm run test:android

# Android: a specific device when several are connected
ANDROID_UDID=R58N12ABCDE npm run test:android

# iOS simulator (macOS)
npm run test:ios
IOS_DEVICE_NAME="iPhone 16 Pro" IOS_PLATFORM_VERSION=18.5 npm run test:ios

# One suite or one spec
npm run test:android -- --suite auth        # auth | forms | gestures
npm run test:android -- --spec tests/mobile/specs/swipe.spec.ts

# Keep a screen recording of every test, not only failures
RECORD_VIDEO=true npm run test:android
```

**iOS on a physical iPhone.** The published iOS build is a simulator build, and Apple does not allow it
on a real device. To run on an iPhone, build and sign the app from the
[demo app source](https://github.com/webdriverio/native-demo-app), then:

```bash
IOS_UDID=<device udid> IOS_APP_PATH=./apps/wdiodemoapp.ipa \
IOS_XCODE_ORG_ID=<team id> npm run test:ios
```

Setting `IOS_UDID` switches the config to real-device capabilities (`xcodeOrgId`, `xcodeSigningId`,
`updatedWDABundleId`).

### Running on Sauce Labs real devices

The same specs run on [Sauce Labs](https://saucelabs.com) through `@wdio/sauce-service`. Android
runs on real devices. The published iOS build is a simulator build, so iOS runs on Sauce simulators
unless a signed `.ipa` is provided (Sauce re-signs it for its real iPhones).

```bash
# 1. Credentials (or put them in .env)
export SAUCE_LABS_USERNAME=<username>
export SAUCE_LABS_ACCESS_KEY=<access key>

# 2. Upload the app builds to Sauce Labs App Storage (once per app version)
npm run app:download
npm run sauce:upload                 # or: npm run sauce:upload -- android

# 3. Run
npm run test:sauce:android           # any available Google Pixel on Android 14
SAUCE_ANDROID_DEVICE="Samsung Galaxy S2.*" SAUCE_ANDROID_VERSION=14 npm run test:sauce:android
npm run test:sauce:ios               # iOS simulator on Sauce Labs
```

| Variable                | Default          | Purpose                                               |
| ----------------------- | ---------------- | ----------------------------------------------------- |
| `SAUCE_REGION`          | `us-west-1`      | Sauce Labs data centre (`eu-central-1`, `us-east-4`)  |
| `SAUCE_ANDROID_DEVICE`  | `Google Pixel.*` | Device name or regular expression                     |
| `SAUCE_ANDROID_VERSION` | `14`             | Android version                                       |
| `SAUCE_IOS_REAL_DEVICE` | `false`          | `true` to use real iPhones (needs an uploaded `.ipa`) |
| `SAUCE_MAX_INSTANCES`   | `2`              | Spec files run in parallel, one device each           |

Each spec file becomes one Sauce Labs job, named after the spec and grouped under one build, with
video, device logs and the pass/fail status in the Sauce Labs dashboard.

### Scenarios

| #   | Scenario                    | Spec             | What is verified                                                                                                                                                                         |
| --- | --------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sign up                     | `signup.spec.ts` | A unique user signs up; the native _"Signed Up! / You successfully signed up!"_ alert is shown. Negative: mismatched passwords show an error.                                            |
| 2   | Login – happy path          | `login.spec.ts`  | The account created in `before()` logs in; the _"Success / You are logged in!"_ alert is shown.                                                                                          |
| 3   | Login – invalid credentials | `login.spec.ts`  | A wrong password shows _"Please enter at least 8 characters"_ and no success alert. An invalid email is covered too.                                                                     |
| 4   | Form interaction            | `forms.spec.ts`  | Text input is echoed back, the switch changes state and label, a dropdown option is selected, _Active_ submits and the alert content is checked; values persist after the dialog closes. |
| 5   | Swipe / scroll              | `swipe.spec.ts`  | Horizontal swipes move the carousel to the next/previous slide (asserted by which slide is centred on screen); a vertical scroll reveals the hidden logo and _"You found me!!!"_.        |
| 6   | Bonus: drag and drop        | `drag.spec.ts`   | All nine puzzle pieces are dragged into their drop zones, the _Congratulations_ screen appears, and _Retry_ resets the puzzle.                                                           |

### Why drag and drop as the bonus scenario

- **It covers a different interaction type.** Scenarios 1–5 are taps, typing and swipes. Drag and drop
  needs a press, hold, move and release on two specific elements, which uses the W3C Actions API in a
  way no other scenario does.
- **The outcome depends on precision and state.** A piece is only accepted if it is released inside its
  own zone, and the success screen appears only after all nine pieces are placed. Gesture timing or
  coordinate bugs in the framework would show up here first.
- **It reflects real apps.** Reordering lists, moving cards on boards and sliders all rely on the same
  gesture. If it is not automated, it ends up being tested by hand.
- **It checks the reset as well.** _Retry_ must restore the starting state, which catches state that
  leaks between attempts.

### Reports and failure evidence

| Output                                | Location                         |
| ------------------------------------- | -------------------------------- |
| Console (spec reporter)               | terminal                         |
| JUnit XML                             | `reports/mobile/junit/`          |
| Appium server log                     | `reports/mobile/wdio-appium.log` |
| Screenshot + MP4 of every failed test | `reports/mobile/artifacts/`      |
| WebdriverIO worker logs               | `reports/mobile/logs/`           |

---

## Part 2 – API tests

The API tests use Playwright's built-in `APIRequestContext` (the `request` fixture). No browser is
launched or installed.

```bash
npm run test:api          # run the tests
npm run test:api:report   # open the HTML report
```

| Scenario                 | Spec              | What is verified                                                                                                                                                                                                 |
| ------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Auth – generate token | `auth.spec.ts`    | `POST /auth` with valid credentials returns `200`, JSON, and a body matching `{ token: <alphanumeric> }`. Also: a new token per request; a wrong password returns `{ reason: "Bad credentials" }` and no token.  |
| 2. Create booking        | `booking.spec.ts` | `POST /booking` returns `200`, a positive `bookingid`, and a `booking` object **deep-equal** to the request payload. Also: the booking can be read back with `GET /booking/{id}`; `additionalneeds` is optional. |

Configuration (all optional, defaults in brackets):

| Variable          | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `API_BASE_URL`    | API host (`https://restful-booker.herokuapp.com`) |
| `BOOKER_USERNAME` | Auth user (`admin`, published in the API docs)    |
| `BOOKER_PASSWORD` | Auth password (`password123`)                     |
| `HTTPS_PROXY`     | Corporate proxy, passed to Playwright when set    |

Reports: HTML in `reports/api/html`, JUnit in `reports/api/junit/results.xml`.

---

## Test design and best practices

**Mobile**

- **Page Object Model.** Specs describe behaviour (`LoginScreen.signUp(user)`), and screen objects own
  the selectors and interactions. Shared UI (tab bar, native alert) lives in `screens/components`.
- **One code base, two platforms.** Accessibility ids (`~input-email`) resolve on both platforms because
  the app maps its test ids to `accessibilityLabel` on Android and `testID` on iOS. Where platforms
  differ (visible text, alerts, pickers, switch state), the difference is contained in one helper or
  screen method using `driver.isAndroid`. Specs contain no platform checks.
- **Selector priority:** accessibility id, then a platform text selector. No XPath and no screen
  coordinates for finding elements. The only coordinate taps are on iOS, where the keyboard is
  dismissed by tapping the empty margin beside the form.
- **No fixed sleeps.** Every wait is on a condition: `waitForDisplayed`, `waitUntil` (carousel settled on
  a new slide), or the alert appearing and disappearing.
- **Independent tests.** WebdriverIO starts a fresh session (and app state) per spec file, and each test
  navigates to its screen in `beforeEach`. Sign-up data is unique per run (`newUser()`).
- **Meaningful assertions.** Alerts are checked by title _and_ message, negative tests also check that no
  success alert appeared, and the carousel test checks which slide is centred on screen, not just that an
  element exists somewhere in the view hierarchy.
- **Evidence on failure.** A screenshot and screen recording are saved automatically for every failed test.
- **Configuration through the environment.** UDIDs, app paths and platform versions come from env
  variables or `.env`, so nothing machine-specific is committed.

**API**

- **Layers:** spec → fixture → client → `APIRequestContext`. Specs never build URLs or headers.
- **Contract checks with Zod.** Strict schemas fail the test if fields are missing, have the wrong type,
  or unexpected fields appear.
- **Exact data checks.** The created booking is compared to the request with `toEqual`, not field by field.
- **Generated test data.** `buildBooking()` creates unique names and valid future dates; overrides make
  variations explicit (`buildBooking({ depositpaid: false })`).
- **Clean-up.** The `cleanUpBooking` fixture deletes every booking a test created, using a fresh token,
  so the shared public API is not filled with test data. This also proves the token from `/auth` works.
- **Parallel and isolated.** Tests do not share state and run in parallel.

**General**

- TypeScript in strict mode, ESLint and Prettier (`npm run lint`, `npm run typecheck`, `npm run format:check`).
- Pinned dependencies through `package-lock.json`; Appium drivers are versioned with the project.

---

## Continuous integration

| Workflow             | Runner                                      | Runs                                                                                                                                            |
| -------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `api-tests.yml`      | Ubuntu                                      | Lint, type-check, format check, API tests                                                                                                       |
| `mobile-android.yml` | Ubuntu + Android emulator (API 34, Pixel 6) | Full mobile suite on Android                                                                                                                    |
| `mobile-ios.yml`     | macOS 15 + iOS simulator                    | Full mobile suite on iOS                                                                                                                        |
| `mobile-sauce.yml`   | Ubuntu + Sauce Labs real devices            | Mobile suite on Sauce Labs (run manually and when the Sauce Labs setup changes; needs `SAUCE_USERNAME` / `SAUCE_ACCESS_KEY` repository secrets) |

The mobile workflows run for pull requests, on pushes to `main` and on demand (_Run workflow_ in the
Actions tab), because emulator and simulator runs are slow. Each workflow uploads its reports (JUnit, HTML, Appium logs, screen recordings) as build artifacts; when a mobile job fails, it also prints a summary of the page source captured at the
failure. CI
uses an emulator and a simulator because hosted runners have no physical devices; the configuration is
the same one used locally against a physical device.

---

## Test execution evidence

See [`docs/evidence`](docs/evidence/README.md) for console logs, reports and screenshots from test
runs.

---

## Known app behaviour and limitations

- **The demo app has no backend.** Login and sign-up are validated in the app only: any well-formed
  email with a password of 8+ characters logs in, and signed-up accounts are not stored. For the
  _invalid credentials_ scenario, the "wrong password" is one the app rejects (fewer than 8 characters),
  which is the only credential error the app can produce. The happy path still signs up first and logs
  in with the same credentials, so the flow matches the real user journey.
- **iOS dropdown (Forms, iOS only).** On the iOS 26 simulator the dropdown's picker does not open from
  automation: an element click, a touch action and XCUITest's native tap all leave it closed. Because of
  this, _Forms › fills in every field_ fails on iOS. It passes on Android, and every other scenario
  passes on both platforms (iOS: 9/10, see `docs/evidence/mobile/ios-simulator-ci-run.txt`). The test
  is left failing rather than skipped, so the gap stays visible.
- **iOS physical devices** need a signed build of the app (see above); the released iOS build is for
  simulators only.
- **Restful Booker is a shared public sandbox.** It is reset periodically and can be slow or briefly
  unavailable; CI retries a failed API test once.
