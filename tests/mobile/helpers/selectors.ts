// The app exposes its test ids as accessibility ids on both Android and iOS.
export const byA11yId = (id: string): string => `~${id}`;

const escapeQuotes = (value: string): string => value.replace(/"/g, '\\"');

/**
 * On iOS a React Native text appears as two identical StaticText elements, and selectors
 * must match exactly one element, so the first match is taken.
 */
export const byText = (text: string): string =>
  driver.isAndroid
    ? `android=new UiSelector().text("${escapeQuotes(text)}")`
    : `-ios class chain:**/XCUIElementTypeStaticText[\`label == "${escapeQuotes(text)}"\`][1]`;
