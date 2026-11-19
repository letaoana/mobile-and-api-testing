/**
 * Hides the on-screen keyboard if it is open so it cannot cover the element
 * the test wants to tap next.
 */
export async function hideKeyboardIfShown(tapTargetToDismiss?: WebdriverIO.Element): Promise<void> {
  if (!(await driver.isKeyboardShown())) {
    return;
  }
  if (driver.isAndroid) {
    await driver.hideKeyboard();
    return;
  }
  // XCUITest cannot always dismiss a keyboard without a "Done" key, so tap a
  // neutral, non-interactive element instead.
  if (tapTargetToDismiss) {
    await tapTargetToDismiss.click();
  } else {
    await driver.hideKeyboard();
  }
}
