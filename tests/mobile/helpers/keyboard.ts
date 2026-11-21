export async function hideKeyboardIfShown(): Promise<void> {
  if (!(await driver.isKeyboardShown())) {
    return;
  }
  if (driver.isAndroid) {
    await driver.hideKeyboard();
    return;
  }
  // The app's iOS keyboards have no Done key; a tap beside the form dismisses them.
  const { height } = await driver.getWindowSize();
  await driver
    .action('pointer', { parameters: { pointerType: 'touch' } })
    .move({ x: 5, y: Math.round(height * 0.3) })
    .down()
    .pause(50)
    .up()
    .perform();
}
