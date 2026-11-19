/**
 * Wraps the platform's native alert dialog (Android AlertDialog / iOS UIAlertController).
 *
 * React Native renders an AppCompat AlertDialog on Android and replaces the title with
 * its own view (`alert_title`), so resource ids are matched on their suffix and both
 * the framework and React Native title ids are accepted.
 */
const androidId = (idPattern: string): string =>
  `android=new UiSelector().resourceIdMatches(".*:id/(${idPattern})$")`;

class NativeAlert {
  private get container() {
    return driver.isAndroid
      ? $(androidId('parentPanel'))
      : $('-ios predicate string:type == "XCUIElementTypeAlert"');
  }

  private get androidTitle() {
    return $(androidId('alert_title|alertTitle'));
  }

  private get androidMessage() {
    return $(androidId('message'));
  }

  private button(label: string) {
    return driver.isAndroid
      ? $(`android=new UiSelector().className("android.widget.Button").text("${label}")`)
      : $(`-ios predicate string:type == "XCUIElementTypeButton" AND label == "${label}"`);
  }

  async waitForIsShown(isShown = true, timeout = 15_000): Promise<void> {
    await this.container.waitForDisplayed({ reverse: !isShown, timeout });
  }

  /**
   * Returns true if the alert appears within `timeout`. Used by negative tests to
   * prove that no alert shows up, allowing for the app's simulated request delay.
   */
  async appearsWithin(timeout: number): Promise<boolean> {
    try {
      await this.container.waitForDisplayed({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  /** Returns the alert title and message. */
  async getContent(): Promise<{ title: string; message: string }> {
    await this.waitForIsShown();
    if (driver.isAndroid) {
      return {
        title: await this.androidTitle.getText(),
        message: await this.androidMessage.getText(),
      };
    }
    // XCUITest returns "<title>\n<message>" for the alert text.
    const [title = '', ...rest] = (await driver.getAlertText()).split('\n');
    return { title, message: rest.join('\n') };
  }

  /** Closes an alert left open by a failed step so the next test starts clean. */
  async dismissIfShown(): Promise<void> {
    if (await this.container.isDisplayed().catch(() => false)) {
      await this.tapButton('OK').catch(() => driver.back());
    }
  }

  async tapButton(label: string): Promise<void> {
    await this.button(label).click();
    await this.waitForIsShown(false);
  }
}

export default new NativeAlert();
