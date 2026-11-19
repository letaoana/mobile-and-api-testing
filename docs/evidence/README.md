# Test execution evidence

## API tests (Playwright)

| File                                                                | What it shows                                       |
| ------------------------------------------------------------------- | --------------------------------------------------- |
| [`api/api-test-run.txt`](api/api-test-run.txt)                       | Console output of `npm run test:api`: 6/6 passed    |
| [`api/html-report-summary.png`](api/html-report-summary.png)         | Playwright HTML report overview                     |
| [`api/html-report-create-booking.png`](api/html-report-create-booking.png) | Detail of the _create booking_ test           |

The same suite runs on every push in the **API tests** GitHub Actions workflow, which also uploads the
HTML and JUnit reports as the `api-report` artifact.

## Mobile tests (WebdriverIO + Appium)

Every run of the **Mobile tests - Android** and **Mobile tests - iOS** workflows uploads its full
output as a build artifact (`android-report-api-34`, `ios-report`):

- `junit/` – JUnit XML per spec file
- `wdio-appium.log` – Appium server log
- `artifacts/` – an MP4 screen recording of every test (`RECORD_VIDEO=true` on CI), plus a
  screenshot of any failure

Local runs against a physical Android device write the same files to `reports/mobile/`.
