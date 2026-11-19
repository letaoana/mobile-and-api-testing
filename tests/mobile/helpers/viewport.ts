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

/**
 * Horizontal distance between the element's centre and the screen's centre, or
 * `undefined` when the element does not exist. Native carousels keep neighbouring
 * slides in the view hierarchy, so the slide closest to the centre is the one
 * the user is looking at.
 */
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

/**
 * True when the element's centre lies inside the visible screen. Used instead of
 * `isDisplayed()` because XCUITest can report off-screen scroll content as visible.
 */
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
