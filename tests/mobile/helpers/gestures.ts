/**
 * Performs a real touch at the centre of the element. Some React Native touchables on
 * iOS (e.g. a picker wrapper that is not accessible) ignore XCUITest's element click,
 * which activates the element through accessibility instead of touching the screen.
 */
export async function touchCentreOf(element: WebdriverIO.Element): Promise<void> {
  const { x, y, width, height } = await driver.getElementRect(element.elementId);
  await driver
    .action('pointer', { parameters: { pointerType: 'touch' } })
    .move({ x: Math.round(x + width / 2), y: Math.round(y + height / 2) })
    .down()
    .pause(80)
    .up()
    .perform();
}
