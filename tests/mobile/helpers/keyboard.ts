/**
 * Hides the on-screen keyboard if it is open so it cannot cover the element
 * the test wants to tap next.
 */
export async function hideKeyboardIfShown(): Promise<void> {
  if (!(await driver.isKeyboardShown())) {
    return;
  }
  if (driver.isAndroid) {
    await driver.hideKeyboard();
    return;
  }
  // The app's keyboards have no "Done" key, so tap the empty margin beside the form:
  // React Native scroll views dismiss the keyboard on a tap outside an input.
  const { height } = await driver.getWindowSize();
  await driver
    .action('pointer', { parameters: { pointerType: 'touch' } })
    .move({ x: 5, y: Math.round(height * 0.3) })
    .down()
    .pause(50)
    .up()
    .perform();
}
