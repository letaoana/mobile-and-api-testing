/**
 * Returns true when the horizontal centre of the element lies inside the screen.
 * Native carousels keep neighbouring slides in the view hierarchy, so
 * `isDisplayed()` alone cannot tell which slide the user is looking at.
 */
export async function isHorizontallyInViewport(element: WebdriverIO.Element): Promise<boolean> {
  if (!(await element.isExisting())) {
    return false;
  }
  const [{ x }, { width }, screen] = await Promise.all([
    element.getLocation(),
    element.getSize(),
    driver.getWindowSize(),
  ]);
  const centreX = x + width / 2;
  return centreX > 0 && centreX < screen.width;
}
