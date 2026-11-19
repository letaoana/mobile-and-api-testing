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
    : // Containers on iOS expose their children's text as their own label, so only match
      // the text element itself (selectors must resolve to exactly one element).
      `-ios predicate string:type == "XCUIElementTypeStaticText" AND label == "${escapeQuotes(text)}"`;
