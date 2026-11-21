interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function getRect(element: WebdriverIO.Element): Promise<Rect | undefined> {
  if (!(await element.isExisting())) {
    return undefined;
  }
  const [{ x, y }, { width, height }] = await Promise.all([
    element.getLocation(),
    element.getSize(),
  ]);
  return { x, y, width, height };
}

/** Carousels keep neighbouring slides in the view tree; the visible one is closest to the centre. */
export async function distanceFromScreenCentreX(
  element: WebdriverIO.Element,
): Promise<number | undefined> {
  const rect = await getRect(element);
  if (!rect) {
    return undefined;
  }
  const { width } = await driver.getWindowSize();
  return Math.abs(rect.x + rect.width / 2 - width / 2);
}

/** Used instead of isDisplayed(): XCUITest can report off-screen scroll content as visible. */
export async function isInViewport(element: WebdriverIO.Element): Promise<boolean> {
  const rect = await getRect(element);
  if (!rect) {
    return false;
  }
  const screen = await driver.getWindowSize();
  const centreX = rect.x + rect.width / 2;
  const centreY = rect.y + rect.height / 2;
  return centreX > 0 && centreX < screen.width && centreY > 0 && centreY < screen.height;
}
