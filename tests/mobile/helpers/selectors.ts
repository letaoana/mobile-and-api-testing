/**
 * Cross-platform selector builders.
 *
 * The demo app exposes `testID`s through `accessibilityLabel` on Android and
 * `testID` on iOS, so `~id` (accessibility id) resolves on both platforms.
 * Visible text needs a platform-specific strategy.
 */

/** Accessibility id selector, shared by Android and iOS. */
export const byA11yId = (id: string): string => `~${id}`;

const escapeQuotes = (value: string): string => value.replace(/"/g, '\\"');

/**
 * Element whose visible text equals `text`.
 *
 * iOS: React Native exposes a text node as two identical StaticText elements, and
 * containers repeat their children's text in their own label. WebdriverIO requires a
 * selector to resolve to exactly one element, so take the first matching StaticText.
 */
export const byText = (text: string): string =>
  driver.isAndroid
    ? `android=new UiSelector().text("${escapeQuotes(text)}")`
    : `-ios class chain:**/XCUIElementTypeStaticText[\`label == "${escapeQuotes(text)}"\`][1]`;
