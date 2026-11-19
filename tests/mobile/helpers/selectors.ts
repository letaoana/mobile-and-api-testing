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

/** Element whose visible text equals `text`. */
export const byText = (text: string): string =>
  driver.isAndroid
    ? `android=new UiSelector().text("${escapeQuotes(text)}")`
    : `-ios predicate string:label == "${escapeQuotes(text)}" OR value == "${escapeQuotes(text)}"`;

/** Element whose visible text contains `text`. */
export const byTextContaining = (text: string): string =>
  driver.isAndroid
    ? `android=new UiSelector().textContains("${escapeQuotes(text)}")`
    : `-ios predicate string:label CONTAINS "${escapeQuotes(text)}"`;
