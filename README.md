# Mobile & API Test Automation

TypeScript test automation for the
[WebdriverIO Native Demo App](https://github.com/webdriverio/native-demo-app) (WebdriverIO 10 +
Appium 4, Mocha) and the [Restful Booker API](https://restful-booker.herokuapp.com/apidoc/index.html)
(Playwright `APIRequestContext` + Zod). Android and iOS share the same specs and screen objects; only
the capabilities differ.

## Quick start

Prerequisites: Node.js 22.22.2+ (`.nvmrc`). For Android: JDK 17+, Android SDK platform-tools with
`ANDROID_HOME` set, and a device with USB debugging on (`adb devices` lists it). For iOS: macOS with
Xcode 16+. Appium and its drivers are project dependencies and start automatically.

```bash
npm ci
npm run app:download          # demo app builds into ./apps (add `-- android` for Android only)

npm run test:api              # API tests (no browser needed); report: npm run test:api:report
npm run test:android          # connected Android device or emulator
npm run test:ios              # iOS simulator
```

Everything is configured through environment variables with sensible defaults; copy `.env.example` to
`.env` to override them (device UDID, app path, platform version, Sauce Labs settings, API host).

**Useful variations**

```bash
ANDROID_UDID=R58N12ABCDE npm run test:android                 # pick a device
npm run test:android -- --suite auth                          # suites: auth | forms | gestures
npm run test:android -- --spec tests/mobile/specs/swipe.spec.ts
RECORD_VIDEO=true npm run test:android                        # keep a video of every test
```

**Sauce Labs real devices** (credentials: `SAUCE_LABS_USERNAME`, `SAUCE_LABS_ACCESS_KEY`):

```bash
npm run sauce:upload          # uploads ./apps to Sauce Labs storage; skips builds already stored
npm run test:sauce:android    # any available real Android device (SAUCE_ANDROID_DEVICE to pin one)
npm run test:sauce:ios        # Sauce Labs iOS simulator
node scripts/sauce-list-platforms.mjs   # devices and versions the account can use
```

**Physical iPhone:** the published iOS build only runs on simulators. Build and sign the app from its
source, then run with `IOS_UDID`, `IOS_APP_PATH` (the `.ipa`) and `IOS_XCODE_ORG_ID` set.

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
config/            WebdriverIO configs (shared, Android, iOS, Sauce Labs) and env loading
tests/mobile/      specs/, screens/ (screen objects), helpers/, data/
tests/api/         specs/, clients/, fixtures/, schemas/ (Zod), data/
scripts/           app download, Sauce Labs upload and platform listing, CI failure summaries
docs/evidence/     test execution evidence (logs, reports, screenshots)
.github/workflows/ CI pipelines
```

## Continuous integration

| Workflow             | Runs                                    | When                                                                       |
| -------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `quality.yml`        | Lint, type-check, format check          | Every push and pull request                                                |
| `api-tests.yml`      | API tests                               | Changes to API tests, Playwright config or dependencies                    |
| `mobile-android.yml` | Mobile suite on an Android emulator     | Pull requests and `main`, when mobile tests, config or dependencies change |
| `mobile-ios.yml`     | Mobile suite on an iOS simulator        | As for Android; manual runs can target one spec or test (`spec`, `grep`)   |
| `mobile-sauce.yml`   | Mobile suite on Sauce Labs real devices | Manually, or when the Sauce Labs setup changes                             |

Every workflow can also be started manually and uploads its reports as artifacts. `mobile-sauce.yml`
needs the `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` repository secrets.

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
- **Restful Booker is a shared public sandbox.** It resets periodically and can be slow; CI retries a
  failed API test once.
