/**
 * Wraps the platform's native alert dialog (Android AlertDialog / iOS UIAlertController).
 *
 * React Native renders either the framework or the AppCompat AlertDialog on Android,
 * so resource ids are matched on their suffix (`android:id/…` or `<package>:id/…`).
 */
const androidId = (id: string): string =>
  `android=new UiSelector().resourceIdMatches(".*:id/${id}$")`;

class NativeAlert {
  private get container() {
    return driver.isAndroid
      ? $(androidId('parentPanel'))
      : $('-ios predicate string:type == "XCUIElementTypeAlert"');
  }

  private get androidTitle() {
    return $(androidId('alertTitle'));
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

  async tapButton(label: string): Promise<void> {
    await this.button(label).click();
    await this.waitForIsShown(false);
  }
}

export default new NativeAlert();
